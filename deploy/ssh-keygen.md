# SSH key for GitHub Actions deploy

Generate a dedicated SSH keypair on your machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-managant" -f ./managant_deploy_key
```

- Add `managant_deploy_key.pub` to the droplet user's `~/.ssh/authorized_keys`
- Add the PRIVATE key content (`managant_deploy_key`) to GitHub Secrets as `DROPLET_SSH_KEY`

Tip: restrict the key in authorized_keys if you want.
