FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Render runs containers with no-new-privileges. SQL Server listens on 1433, so
# its inherited low-port capability is unnecessary and must be removed.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && setcap -r /opt/mssql/bin/sqlservr \
    && mkdir -p /home/mssql/.ssh \
    && chown -R mssql:root /home/mssql \
    && chmod 0700 /home/mssql/.ssh

COPY --chmod=0755 infra/mssql/bootstrap.sh /usr/local/bin/ptsnsu-bootstrap

USER mssql

ENTRYPOINT ["/usr/local/bin/ptsnsu-bootstrap"]
