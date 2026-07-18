#!/usr/bin/env bash
set -euo pipefail

AWS_REGION=${AWS_REGION:-ap-southeast-5}
readonly AWS_REGION
readonly INSTANCES=(verae-prod verae-staging)

for command_name in aws curl jq; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is missing: $command_name" >&2
    exit 1
  fi
done

public_ip=$(curl --fail --silent --show-error --max-time 10 https://checkip.amazonaws.com)
public_ip=${public_ip//$'\r'/}
public_ip=${public_ip//$'\n'/}

IFS=. read -r octet1 octet2 octet3 octet4 extra <<<"$public_ip"
if [[ -n ${extra:-} || -z ${octet1:-} || -z ${octet2:-} || -z ${octet3:-} || -z ${octet4:-} ]]; then
  echo "Could not validate the detected public IPv4 address: $public_ip" >&2
  exit 1
fi
for octet in "$octet1" "$octet2" "$octet3" "$octet4"; do
  if [[ ! $octet =~ ^[0-9]+$ ]] || ((10#$octet > 255)); then
    echo "Could not validate the detected public IPv4 address: $public_ip" >&2
    exit 1
  fi
done
readonly public_ip
readonly ssh_cidr="$public_ip/32"

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT

echo "Updating Lightsail SSH access to $ssh_cidr in $AWS_REGION"

for instance_name in "${INSTANCES[@]}"; do
  state_file="$work_dir/$instance_name-state.json"
  input_file="$work_dir/$instance_name-input.json"

  aws lightsail get-instance-port-states \
    --region "$AWS_REGION" \
    --instance-name "$instance_name" \
    --output json >"$state_file"

  ssh_rule_count=$(jq '[.portStates[] | select(.protocol == "tcp" and .fromPort == 22 and .toPort == 22)] | length' "$state_file")
  if [[ $ssh_rule_count -ne 1 ]]; then
    echo "Expected exactly one TCP/22 rule on $instance_name; found $ssh_rule_count. No changes made to this instance." >&2
    exit 1
  fi

  jq \
    --arg instance_name "$instance_name" \
    --arg ssh_cidr "$ssh_cidr" \
    '{
      instanceName: $instance_name,
      portInfos: [.portStates[] | {
        fromPort,
        toPort,
        protocol,
        cidrs: (if .protocol == "tcp" and .fromPort == 22 and .toPort == 22 then [$ssh_cidr] else (.cidrs // []) end),
        ipv6Cidrs: (.ipv6Cidrs // []),
        cidrListAliases: (if .protocol == "tcp" and .fromPort == 22 and .toPort == 22 then ["lightsail-connect"] else (.cidrListAliases // []) end)
      }]
    }' "$state_file" >"$input_file"

  aws lightsail put-instance-public-ports \
    --region "$AWS_REGION" \
    --cli-input-json "file://$input_file" >/dev/null

  echo "Updated $instance_name"
done

echo "Done. Terminal SSH is restricted to $ssh_cidr; Lightsail browser SSH remains available as a fallback."
