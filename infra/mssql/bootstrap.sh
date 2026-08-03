#!/usr/bin/env bash
set -euo pipefail

/opt/mssql/bin/launch_sqlservr.sh /opt/mssql/bin/sqlservr &
sqlserver_pid=$!

terminate_sqlserver() {
  kill -TERM "$sqlserver_pid" 2>/dev/null || true
}
trap terminate_sqlserver INT TERM

if [[ -n "${PTSNSU_BOOTSTRAP_URL:-}" && ! -f /var/opt/mssql/.ptsnsu-import-complete ]]; then
  echo "PTSNSU restore: waiting for SQL Server"
  until SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q "SELECT 1" >/dev/null 2>&1; do
    if ! kill -0 "$sqlserver_pid" 2>/dev/null; then
      wait "$sqlserver_pid"
      exit $?
    fi
    sleep 2
  done

  restore_dir=/var/opt/mssql/ptsnsu-restore
  mkdir -p "$restore_dir"
  echo "PTSNSU restore: downloading verified native backups"
  curl --fail --silent --show-error --location \
    --header "X-Import-Token: ${PTSNSU_BOOTSTRAP_TOKEN:?}" \
    --output "$restore_dir/database.tgz" \
    "$PTSNSU_BOOTSTRAP_URL"
  tar -xzf "$restore_dir/database.tgz" -C "$restore_dir"
  gzip -dfk "$restore_dir/primary.bak.gz" "$restore_dir/admission.bak.gz"

  echo "PTSNSU restore: replacing partial databases"
  SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q \
    "IF DB_ID(N'PSNSUniversityOnline') IS NOT NULL BEGIN ALTER DATABASE [PSNSUniversityOnline] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [PSNSUniversityOnline]; END; IF DB_ID(N'PtsnsuAdmission') IS NOT NULL BEGIN ALTER DATABASE [PtsnsuAdmission] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [PtsnsuAdmission]; END;"

  echo "PTSNSU restore: restoring primary database"
  SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q \
    "RESTORE DATABASE [PSNSUniversityOnline] FROM DISK = N'$restore_dir/primary.bak' WITH MOVE N'PSNSUniversityOnline' TO N'/var/opt/mssql/data/PSNSUniversityOnline.mdf', MOVE N'PSNSUniversityOnline_log' TO N'/var/opt/mssql/data/PSNSUniversityOnline_log.ldf', REPLACE, RECOVERY, CHECKSUM, STATS = 10;"

  echo "PTSNSU restore: restoring admission database"
  SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q \
    "RESTORE DATABASE [PtsnsuAdmission] FROM DISK = N'$restore_dir/admission.bak' WITH MOVE N'PtsnsuAdmission' TO N'/var/opt/mssql/data/PtsnsuAdmission.mdf', MOVE N'PtsnsuAdmission_log' TO N'/var/opt/mssql/data/PtsnsuAdmission_log.ldf', REPLACE, RECOVERY, CHECKSUM, STATS = 10;"

  SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q \
    "IF (SELECT COUNT(*) FROM [PSNSUniversityOnline].sys.tables) < 57 THROW 50000, 'Primary database table verification failed', 1; IF (SELECT COUNT(*) FROM [PSNSUniversityOnline].sys.procedures) < 178 THROW 50000, 'Primary database procedure verification failed', 1;"

  touch /var/opt/mssql/.ptsnsu-import-complete
  echo "PTSNSU restore: native database restore complete"
fi

if [[ -f /var/opt/mssql/.ptsnsu-import-complete ]]; then
  rm -rf -- /var/opt/mssql/ptsnsu-import /var/opt/mssql/ptsnsu-restore
  echo "PTSNSU restore: transfer artifacts removed"
fi

wait "$sqlserver_pid"
