# Stories Feature - Deployment Checklist

Complete this checklist before deploying the Stories feature to production.

---

## ✅ Pre-Deployment

### Database Setup
- [ ] Run `ADD_STORIES_FEATURE.sql` in Supabase SQL Editor
- [ ] Verify `stories` table exists
- [ ] Verify `story_views` table exists
- [ ] Check indexes were created
- [ ] Verify RLS policies are active
- [ ] Test RLS: Non-matches cannot view stories

### Storage Setup
- [ ] Verify `stories` bucket exists in Supabase Storage
- [ ] Confirm bucket is set to `public`
- [ ] Check storage quota is sufficient
- [ ] Verify CORS settings allow your domain
- [ ] Test file upload via Supabase dashboard

### Cron Jobs
- [ ] Verify `expire-old-stories` cron job scheduled (hourly)
- [ ] Verify `cleanup-expired-stories` cron job scheduled (daily)
- [ ] Manually test: `SELECT expire_old_stories();`
- [ ] Manually test: `SELECT cleanup_expired_stories();`

---

## ✅ Code Review

### Backend
- [ ] Review all API routes in `app/api/stories/`
- [ ] Check error handling in upload route
- [ ] Verify authentication checks in all routes
- [ ] Confirm file size validation (50MB max)
- [ ] Test MIME type validation

### Frontend
- [ ] Review StoriesRing component
- [ ] Review StoryViewer component
- [ ] Review StoryUpload component
- [ ] Check TypeScript types are correct
- [ ] Verify no console errors in browser

### Integration
- [ ] Stories appear on `/matches` page
- [ ] Upload modal opens/closes correctly
- [ ] Viewer opens/closes correctly
- [ ] State updates properly after actions

---

## ✅ Testing

### Functional Tests
- [ ] Upload image story
- [ ] Upload video story
- [ ] View own stories
- [ ] View match's stories
- [ ] Delete own story
- [ ] View tracking works
- [ ] Viewer list shows correctly
- [ ] Ring updates after upload
- [ ] Ring updates after viewing

### Privacy Tests
- [ ] Non-matches cannot view stories (database level)
- [ ] Non-matches cannot view stories (API level)
- [ ] Cannot view expired stories
- [ ] Cannot delete others' stories
- [ ] RLS policies enforce all rules

### Performance Tests
- [ ] Multiple stories load quickly
- [ ] Story viewer is smooth
- [ ] Progress bars animate smoothly
- [ ] No memory leaks in viewer
- [ ] Images load progressively
- [ ] Videos play without buffering (if good connection)

### Edge Cases
- [ ] Empty state (no stories)
- [ ] Large files (near 50MB)
- [ ] Very long captions (200 chars)
- [ ] Concurrent uploads
- [ ] Network errors handled gracefully
- [ ] Invalid file types rejected

### Mobile Tests
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Touch gestures work (tap, hold, swipe)
- [ ] Responsive layout on small screens
- [ ] Works in portrait mode
- [ ] Works in landscape mode

### Desktop Tests
- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Safari
- [ ] Works on Edge
- [ ] Mouse interactions work
- [ ] Keyboard navigation works

---

## ✅ Security

### Authentication
- [ ] All routes require authentication
- [ ] JWT tokens validated correctly
- [ ] Expired tokens handled

### Authorization
- [ ] RLS policies tested thoroughly
- [ ] API routes verify user permissions
- [ ] Cannot access others' resources

### Input Validation
- [ ] File size limits enforced (50MB)
- [ ] File type validation works
- [ ] Caption length limited (200 chars)
- [ ] SQL injection not possible
- [ ] XSS attacks prevented

### Storage Security
- [ ] Files stored with secure paths (user_id/timestamp)
- [ ] Cannot guess/brute-force file URLs
- [ ] Deleted files actually removed from storage

---

## ✅ Performance

### Database
- [ ] Indexes exist on all foreign keys
- [ ] Query performance tested with 100+ stories
- [ ] No N+1 query problems
- [ ] Database function optimized

### API
- [ ] Response times < 200ms for reads
- [ ] Response times < 2s for uploads
- [ ] Pagination considered (if needed)

### Frontend
- [ ] Images lazy loaded
- [ ] Bundle size reasonable
- [ ] No unnecessary re-renders
- [ ] Components memoized where needed

### Storage
- [ ] Files compressed appropriately
- [ ] CDN considered (if needed)
- [ ] Cleanup job runs successfully

---

## ✅ Monitoring

### Logging
- [ ] Upload errors logged
- [ ] View tracking logged
- [ ] Deletion actions logged
- [ ] Cron job results logged

### Metrics to Track
- [ ] Number of stories posted per day
- [ ] Average views per story
- [ ] Upload success rate
- [ ] Storage usage
- [ ] Cron job execution times

### Alerts to Set Up
- [ ] Storage quota > 80%
- [ ] Upload failure rate > 5%
- [ ] Cron jobs failing
- [ ] API error rate spike

---

## ✅ Documentation

- [ ] Code commented appropriately
- [ ] README updated with Stories feature
- [ ] API documentation created
- [ ] User guide prepared (if needed)
- [ ] Admin guide prepared

---

## ✅ Deployment

### Pre-Deploy
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database migration script ready
- [ ] Rollback plan prepared

### Deploy Steps
1. [ ] Run database migration in production
2. [ ] Verify migration successful
3. [ ] Deploy application code
4. [ ] Verify deployment successful
5. [ ] Test basic functionality in production
6. [ ] Monitor for errors

### Post-Deploy
- [ ] Smoke test in production
- [ ] Upload a test story
- [ ] View a test story
- [ ] Delete test story
- [ ] Check logs for errors
- [ ] Monitor performance metrics

---

## ✅ Communication

### Team
- [ ] Notify team of deployment
- [ ] Share documentation links
- [ ] Explain new feature

### Users (if announcing)
- [ ] Prepare announcement
- [ ] Create tutorial/guide
- [ ] Plan social media posts
- [ ] Prepare FAQs

---

## ✅ Post-Launch Monitoring (First 24 Hours)

### Watch For
- [ ] Upload success rate
- [ ] API error rates
- [ ] Database performance
- [ ] Storage usage growth
- [ ] User engagement metrics
- [ ] Bug reports

### Quick Checks
- [ ] Cron jobs ran successfully
- [ ] Stories expiring correctly
- [ ] Old files being cleaned up
- [ ] No RLS policy breaches
- [ ] No storage quota issues

---

## 🚨 Rollback Plan

If issues occur:

1. **Database Issues:**
   - [ ] Have SQL to drop new tables ready
   - [ ] Know how to restore from backup

2. **Application Issues:**
   - [ ] Can quickly revert code deployment
   - [ ] Previous version still works without stories

3. **Storage Issues:**
   - [ ] Can disable uploads temporarily
   - [ ] Know how to clean up files manually

---

## ✅ Success Criteria

Feature is successfully deployed when:

- [ ] ✅ Users can upload stories
- [ ] ✅ Users can view matches' stories
- [ ] ✅ Privacy is enforced (only matches)
- [ ] ✅ Stories expire after 24 hours
- [ ] ✅ View tracking works correctly
- [ ] ✅ No performance degradation
- [ ] ✅ No security vulnerabilities
- [ ] ✅ Mobile and desktop both work
- [ ] ✅ Error rate < 1%
- [ ] ✅ Response times acceptable

---

## 📋 Final Sign-Off

### Technical Lead
- [ ] All code reviewed
- [ ] All tests passed
- [ ] Performance acceptable
- Date: ___________  Signature: ___________

### QA/Testing
- [ ] All test scenarios completed
- [ ] No critical bugs found
- [ ] Ready for production
- Date: ___________  Signature: ___________

### Product Owner
- [ ] Feature meets requirements
- [ ] UX is acceptable
- [ ] Ready to launch
- Date: ___________  Signature: ___________

---

## 🎉 Post-Launch

After successful deployment:

1. [ ] Celebrate with team! 🎊
2. [ ] Monitor metrics for first week
3. [ ] Gather user feedback
4. [ ] Plan improvements based on usage
5. [ ] Document lessons learned

---

**Good luck with your deployment!** 🚀

The Stories feature will significantly boost engagement on your dating app. Users love sharing daily moments, and this creates natural conversation starters between matches.
