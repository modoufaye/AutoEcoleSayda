FROM postgres:17-alpine
RUN apk add --no-cache rclone
COPY backup.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh \
 && echo "0 3 * * * /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
