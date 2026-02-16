FROM grafana/grafana:latest

COPY ./dashboards/ /dashboards/

COPY ./datasources/ /datasources/

COPY ./config/grafana.ini /etc/grafana/.

COPY ./scripts/setup_grafana.sh /.

WORKDIR /

USER root

RUN --mount=type=secret,id=admin_password,target=/run/secrets/admin_password bash setup_grafana.sh

EXPOSE 3000
