# Reporting sensitive data or vulnerabilities

Do not put credentials, personal data, private paths or exploit payloads containing real secrets in a public issue.

Use GitHub's private vulnerability reporting when it is available in the repository's Security tab. If it is unavailable, contact the maintainer through the public profile and request a private reporting channel before sharing details.

Publication checks inspect paths, recognisable credential signatures and reachable history. Gitleaks adds independent signature/entropy detection. These checks reduce accidental disclosure; they cannot certify that arbitrary text or images contain no sensitive information. A suspected finding must be investigated without reproducing its value in logs.
