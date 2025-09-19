# Threat Model (STRIDE summary)
- Spoofing: strong auth between services
- Tampering: append-only + signatures on events
- Repudiation: event immutability + audit logs
- Info Disclosure: PII encryption at rest
- DoS: rate limits, circuit breakers
- EoP: least privilege IAM
