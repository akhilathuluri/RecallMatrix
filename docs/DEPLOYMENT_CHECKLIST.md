# 🚀 Telegram Bot Deployment Checklist

Use this checklist to ensure a smooth deployment of the Telegram bot integration.

## Pre-Deployment

### 1. Telegram Bot Setup
- [ ] Created bot via @BotFather
- [ ] Saved bot token securely
- [ ] Chosen a good username (e.g., @YourAppMemoryBot)
- [ ] Set bot profile picture (optional)
- [ ] Set bot description (optional)

### 2. Database Preparation
- [ ] Database migration file reviewed
- [ ] Migration tested in development
- [ ] Backup of production database created
- [ ] Migration applied to production database
- [ ] Tables created successfully (`telegram_auth_codes`, `telegram_connections`)
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Test queries run successfully

### 3. Code Review
- [ ] All Python code reviewed
- [ ] All TypeScript code reviewed
- [ ] Dependencies up to date
- [ ] No hardcoded secrets or tokens
- [ ] Environment variables properly configured
- [ ] Error handling comprehensive
- [ ] Logging implemented

### 4. Security Check
- [ ] API keys not committed to Git
- [ ] `.env` files in `.gitignore`
- [ ] RLS policies tested
- [ ] Code expiry working (10 minutes)
- [ ] One-time code usage enforced
- [ ] API key authentication working
- [ ] HTTPS configured for webhooks

## Backend Deployment

### 5. Python Backend Setup
- [ ] Choose deployment platform (Railway/Render/Fly.io/etc.)
- [ ] Repository connected
- [ ] Python version set (3.11+)
- [ ] Build command configured: `pip install -r backend/requirements.txt`
- [ ] Start command configured: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check endpoint configured: `/health`

### 6. Backend Environment Variables
Set all required variables in your deployment platform:

- [ ] `TELEGRAM_BOT_TOKEN` - From BotFather
- [ ] `TELEGRAM_WEBHOOK_URL` - Your deployed backend URL + /api/telegram/webhook
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `GITHUB_TOKEN` - GitHub personal access token
- [ ] `GITHUB_MODELS_ENDPOINT` - https://models.inference.ai.azure.com
- [ ] `APP_BASE_URL` - Your frontend URL
- [ ] `API_SECRET_KEY` - Random 32-character string
- [ ] `AUTH_CODE_EXPIRY_MINUTES` - 10 (or your preference)
- [ ] `ENVIRONMENT` - production
- [ ] `LOG_LEVEL` - INFO

### 7. Backend Deployment
- [ ] Deploy backend
- [ ] Check logs for errors
- [ ] Visit `/health` endpoint - should return `{"status":"healthy"}`
- [ ] Visit `/health/detailed` endpoint - check all services
- [ ] Test `/api/telegram/bot-info` endpoint

### 8. Webhook Configuration
```bash
curl -X POST https://your-backend-url.com/api/telegram/set-webhook
```
- [ ] Webhook set successfully
- [ ] Verify with: `curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo`
- [ ] Check `pending_update_count` is 0
- [ ] Check `last_error_date` is not present

## Frontend Deployment

### 9. Next.js Frontend Setup
- [ ] Environment variables added to Vercel/Netlify:
  - [ ] `NEXT_PUBLIC_TELEGRAM_BACKEND_URL` - Your backend URL
  - [ ] `TELEGRAM_API_SECRET_KEY` - Same as backend
- [ ] All existing variables still present
- [ ] Build succeeded
- [ ] No deployment errors

### 10. Frontend Verification
- [ ] Visit `/integrations` page
- [ ] Telegram integration card visible
- [ ] "Generate Connection Code" button works
- [ ] No console errors
- [ ] Responsive on mobile

## Testing

### 11. End-to-End Testing
- [ ] Open Telegram, search for your bot
- [ ] Send `/start` command - receives welcome message
- [ ] In web app, generate connection code
- [ ] Code displays with countdown timer
- [ ] Copy code works
- [ ] In Telegram, send `/connect <CODE>`
- [ ] Receives success confirmation
- [ ] In web app, status shows "Connected"
- [ ] Telegram username displayed correctly

### 12. Feature Testing
- [ ] Send text message to bot → Memory created
- [ ] Send photo to bot → Photo memory created
- [ ] Send document to bot → Document memory created
- [ ] Send `/list` → Shows recent memories
- [ ] Send `/search <query>` → Returns results
- [ ] Send `/status` → Shows correct stats
- [ ] Send `/help` → Shows commands
- [ ] Check web app → All memories visible
- [ ] Search in web app → Bot memories searchable
- [ ] Knowledge Graph → Bot memories included

### 13. Error Scenarios
- [ ] Test expired code → Shows error message
- [ ] Test invalid code → Shows error message
- [ ] Test used code → Shows error message
- [ ] Test disconnected user sending message → Shows connect prompt
- [ ] Test rate limiting (if implemented)
- [ ] Test network failures gracefully handled

## Monitoring Setup

### 14. Logging
- [ ] Backend logs accessible
- [ ] Log level appropriate (INFO for production)
- [ ] Error tracking configured (Sentry/etc.)
- [ ] Log rotation configured (if needed)

### 15. Monitoring
- [ ] Health check endpoint monitored
- [ ] Uptime monitoring configured
- [ ] Alert on service down
- [ ] Alert on high error rate
- [ ] Database connection monitoring

### 16. Metrics
Set up monitoring for:
- [ ] Auth code generation rate
- [ ] Connection success rate
- [ ] Memory creation rate from Telegram
- [ ] Embedding generation success rate
- [ ] Search query performance
- [ ] Webhook response times

## Documentation

### 17. Documentation Review
- [ ] README updated with Telegram info
- [ ] TELEGRAM_SETUP.md reviewed
- [ ] QUICK_REFERENCE.md available
- [ ] Architecture diagram reviewed
- [ ] Environment variables documented

### 18. User Documentation
- [ ] Instructions clear for users
- [ ] Screenshots/GIFs prepared (optional)
- [ ] FAQ section created
- [ ] Troubleshooting guide available
- [ ] Support contact provided

## Post-Deployment

### 19. Announcement
- [ ] Announce feature to users
- [ ] Create tutorial/guide
- [ ] Prepare support materials
- [ ] Monitor user feedback

### 20. Initial Monitoring (First 24h)
- [ ] Watch error logs
- [ ] Monitor connection success rate
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Address any issues quickly

### 21. Backup & Recovery
- [ ] Database backup schedule configured
- [ ] Tested restore procedure
- [ ] Recovery plan documented
- [ ] Emergency contacts listed

### 22. Performance Tuning
After 1 week:
- [ ] Review slow queries
- [ ] Check connection pool utilization
- [ ] Review embedding generation times
- [ ] Optimize if needed
- [ ] Check rate limits usage

## Cleanup

### 23. Development Resources
- [ ] Remove development webhooks
- [ ] Clean up test bots (if any)
- [ ] Remove development environment variables
- [ ] Archive development logs

### 24. Security Audit
- [ ] Review access logs
- [ ] Check for unusual activity
- [ ] Verify all secrets rotated
- [ ] Review RLS policies
- [ ] Check API key usage

## Maintenance

### 25. Regular Tasks (Weekly)
- [ ] Review error logs
- [ ] Check disk usage
- [ ] Monitor database size
- [ ] Review slow queries
- [ ] Update dependencies (if needed)

### 26. Regular Tasks (Monthly)
- [ ] Clean expired auth codes
- [ ] Review inactive connections
- [ ] Check API rate limits
- [ ] Review costs
- [ ] Update documentation

## Emergency Contacts

### Key People
- [ ] Database admin contact: _______________
- [ ] Backend maintainer: _______________
- [ ] Frontend maintainer: _______________
- [ ] DevOps contact: _______________

### Service Contacts
- [ ] Telegram Bot Support: https://core.telegram.org/bots/faq
- [ ] Supabase Support: https://supabase.com/support
- [ ] GitHub Support: https://support.github.com/
- [ ] Hosting Support: _______________

## Rollback Plan

### If Deployment Fails
1. [ ] Revert to previous deployment
2. [ ] Remove webhook: `curl -X POST https://your-backend/api/telegram/remove-webhook`
3. [ ] Check logs for errors
4. [ ] Fix issues in development
5. [ ] Test thoroughly before redeploying

### If Database Issues
1. [ ] Restore from backup
2. [ ] Check migration logs
3. [ ] Re-run migrations if needed
4. [ ] Verify data integrity

## Success Criteria

Deployment is successful when:
- [x] Backend health check returns healthy
- [x] Frontend loads without errors
- [x] Bot responds to commands
- [x] Users can connect accounts
- [x] Memories created via Telegram appear in web app
- [x] Search works for Telegram memories
- [x] No critical errors in logs
- [x] Monitoring shows green status

---

## Notes Section

Use this space for deployment-specific notes:

```
Date: _____________
Deployed by: _____________
Backend URL: _____________
Frontend URL: _____________
Bot Username: _____________

Issues encountered:


Resolutions:


Additional notes:

```

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

Mark each item as you complete it. Good luck with your deployment! 🚀
