FROM prom/prometheus:latest

WORKDIR /config/prometheus

COPY ./config/prometheus.yml /config/prometheus/.

COPY ./config/rules.yml /config/prometheus/.

EXPOSE 9090

CMD ["--config.file=/config/prometheus/prometheus.yml"]
