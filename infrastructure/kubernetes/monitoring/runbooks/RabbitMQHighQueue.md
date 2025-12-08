# Runbook: RabbitMQHighQueue Alert

## Alert Description
**Alert Name:** RabbitMQHighQueue
**Severity:** Warning
**Category:** Messaging

RabbitMQ queue has more than 10,000 messages pending.

## Symptoms
- Queue depth growing
- Messages not being processed
- Delayed job processing
- Consumer lag

## Impact
**User Impact:** Medium - Delayed async operations
**Business Impact:** Medium - Job applications, notifications delayed

## Diagnosis

```bash
# Check RabbitMQ management UI
kubectl port-forward svc/rabbitmq -n jobpilot 15672:15672
# Visit http://localhost:15672

# Check queue details
kubectl exec -it <rabbitmq-pod> -n jobpilot -- rabbitmqctl list_queues name messages consumers

# Check consumer status
kubectl get pods -n jobpilot -l role=consumer
```

## Resolution

### Increase Consumers
```bash
# Scale up consumer deployment
kubectl scale deployment/<consumer-service> --replicas=5 -n jobpilot
```

### Purge Old Messages (if safe)
```bash
# Only if messages are stale/expired
kubectl exec -it <rabbitmq-pod> -n jobpilot -- \
  rabbitmqctl purge_queue <queue-name>
```

### Check Consumer Health
```bash
# Restart consumers if stuck
kubectl rollout restart deployment/<consumer-service> -n jobpilot

# Check consumer logs
kubectl logs -l role=consumer -n jobpilot --tail=100
```

## Prevention
- Auto-scaling for consumers
- Dead letter queues
- Message TTL
- Consumer health monitoring

## Escalation
- **Level 1:** On-call engineer
- **Level 2:** Backend team (if queue > 50k)
