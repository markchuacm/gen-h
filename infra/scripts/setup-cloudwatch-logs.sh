#!/usr/bin/env bash
# Install and start the Amazon CloudWatch agent on a Verae Lightsail instance.
# It ships every Docker container's JSON logs to CloudWatch Logs and publishes
# instance disk + memory usage as custom metrics (Lightsail's native metrics do
# NOT include filesystem usage, so the disk-full alarm depends on this).
#
#   sudo VERAE_ENV=production infra/scripts/setup-cloudwatch-logs.sh
#   sudo VERAE_ENV=staging    infra/scripts/setup-cloudwatch-logs.sh
#
# Prerequisite: credentials for an IAM user restricted to CloudWatch Logs write
# + PutMetricData must already be present at /root/.aws/credentials (profile
# "cloudwatch"). See docs/backend/aws-lightsail-runbook.md for the exact policy.
set -euo pipefail

VERAE_ENV=${VERAE_ENV:-}
case "$VERAE_ENV" in
  production|staging) ;;
  *)
    echo "Set VERAE_ENV=production or VERAE_ENV=staging" >&2
    exit 1
    ;;
esac

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo." >&2
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CONFIG_TEMPLATE="$SCRIPT_DIR/../aws/cloudwatch-agent-config.json"
if [[ ! -f "$CONFIG_TEMPLATE" ]]; then
  echo "Missing agent config template at $CONFIG_TEMPLATE" >&2
  exit 1
fi

instance_name=${VERAE_INSTANCE_NAME:-$(hostname)}
log_group="/verae/$VERAE_ENV/docker"
log_stream="$instance_name"

# --- Install the agent (idempotent) --------------------------------------
if ! dpkg -s amazon-cloudwatch-agent >/dev/null 2>&1; then
  arch=$(dpkg --print-architecture)
  tmp_deb=$(mktemp --suffix=.deb)
  curl -fsSL "https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/${arch}/latest/amazon-cloudwatch-agent.deb" -o "$tmp_deb"
  dpkg -i -E "$tmp_deb"
  rm -f "$tmp_deb"
fi

# --- Render the config (the agent does not expand shell variables) --------
install -d -m 755 /opt/aws/amazon-cloudwatch-agent/etc
rendered=/opt/aws/amazon-cloudwatch-agent/etc/verae-agent.json
sed -e "s#__LOG_GROUP__#${log_group}#g" \
    -e "s#__LOG_STREAM__#${log_stream}#g" \
    "$CONFIG_TEMPLATE" >"$rendered"
chmod 644 "$rendered"

# The agent reads AWS credentials from /root/.aws (profile "cloudwatch").
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c "file:$rendered"

echo "CloudWatch agent running for $VERAE_ENV."
echo "  Log group:  $log_group"
echo "  Metrics:    namespace Verae -> disk_used_percent, mem_used_percent (dimension host=$instance_name)"
echo "Create a CloudWatch alarm on Verae/disk_used_percent >= 85 for host $instance_name."
