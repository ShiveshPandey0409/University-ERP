#!/usr/bin/env bash
set -euo pipefail

/opt/mssql/bin/launch_sqlservr.sh /opt/mssql/bin/sqlservr &
sqlserver_pid=$!

terminate_sqlserver() {
  kill -TERM "$sqlserver_pid" 2>/dev/null || true
}
trap terminate_sqlserver INT TERM

if [[ -n "${PTSNSU_BOOTSTRAP_URL:-}" && ! -f /var/opt/mssql/.ptsnsu-import-complete ]]; then
  echo "PTSNSU bootstrap: waiting for SQL Server"
  until SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q "SELECT 1" >/dev/null 2>&1; do
    if ! kill -0 "$sqlserver_pid" 2>/dev/null; then
      wait "$sqlserver_pid"
      exit $?
    fi
    sleep 2
  done

  import_dir=/var/opt/mssql/ptsnsu-import
  mkdir -p "$import_dir"
  echo "PTSNSU bootstrap: downloading verified archive"
  curl --fail --silent --show-error --location \
    --header "X-Import-Token: ${PTSNSU_BOOTSTRAP_TOKEN:?}" \
    --output "$import_dir/database.tgz" \
    "$PTSNSU_BOOTSTRAP_URL"
  tar -xzf "$import_dir/database.tgz" -C "$import_dir"

  echo "PTSNSU bootstrap: removing partial databases"
  SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -Q \
    "IF DB_ID(N'PSNSUniversityOnline') IS NOT NULL BEGIN ALTER DATABASE [PSNSUniversityOnline] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [PSNSUniversityOnline]; END; IF DB_ID(N'PtsnsuAdmission') IS NOT NULL BEGIN ALTER DATABASE [PtsnsuAdmission] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [PtsnsuAdmission]; END;"

  echo "PTSNSU bootstrap: importing primary database"
  if ! SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -r 1 \
    -i "$import_dir/load/backup_ready.sql" \
    >"$import_dir/primary.log" 2>&1; then
    tail -100 "$import_dir/primary.log"
    exit 1
  fi

  echo "PTSNSU bootstrap: importing admission database"
  if ! SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -C -b -r 1 \
    -i "$import_dir/reconstruct_admission.sql" \
    >"$import_dir/admission.log" 2>&1; then
    tail -100 "$import_dir/admission.log"
    exit 1
  fi

  touch /var/opt/mssql/.ptsnsu-import-complete
  echo "PTSNSU bootstrap: database import complete"
fi

wait "$sqlserver_pid"
