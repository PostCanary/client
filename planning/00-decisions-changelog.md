# Decisions Changelog — March 25, 2026 Planning Session

Changes made to the original product spec during the coding brief and stress testing session. The original spec (`00-product-spec.md`) is the March 23-24 document. These are modifications or clarifications made on top of it.

## Product Decisions

### Step 3 Renamed
- **Was:** "Design Your Postcard"
- **Now:** "Your Postcard"
- **Why:** V1 has no Fabric.js canvas editor — the postcard is auto-generated. "Design" implies the customer builds from scratch. "Your Postcard" implies ownership without promising effort. (Wiebe review)

### Campaign Model Naming
- **Was:** New campaigns would use the existing `Campaign` model
- **Now:** New direct mail campaigns use `MailCampaign` (tablename `mail_campaigns`)
- **Why:** Existing `Campaign` model is for analytics batch grouping. Using the same name would break existing analytics. Separate model, merge planned for Round 2 when analytics auto-integration is built. (Stress test finding)

### Existing User Onboarding
- **Was:** Show re-onboarding modal for existing users missing new fields
- **Now:** NO modal for existing users. Missing fields (location, services) collected in-context inside the wizard when they first click "+ Send Postcards"
- **Why:** Forced re-onboarding interrupts engaged users and feels like something broke. In-context collection is natural — asking for location when they're looking at a map makes sense. (Hulick, Campbell, Hiten Shah)

### Onboarding Screen 1
- **Was:** Just "Business name"
- **Now:** "Your name" + "Business name" on one screen
- **Why:** Need both the person's name (account) and business name (postcards). Combined screen keeps it fast.

### Website URL
- **Was:** Required in onboarding
- **Now:** Optional with skip nudge (loss aversion copy: "Without your website, we can't auto-pull your logo, photos, and reviews")
- **Why:** Some new businesses don't have websites. Blocking them defeats the purpose. Skip nudge converts most without blocking the rest. (Cialdini)

### CRM Field
- **Was:** Required in onboarding
- **Now:** Asked later in context (after first campaign, when results matter)
- **Why:** Progressive disclosure — don't ask until it's relevant. 60-second onboarding stays at 60 seconds.

### profile_complete Logic
- **Was:** Requires `industry AND crm AND mail_provider AND website_url`
- **Now:** Requires `industry AND location` (minimum for new onboarding)
- **Why:** New onboarding has different required fields. Old fields become optional.

### auth.ts Onboarding Trigger
- **Was:** Plan to modify `fetchMe()` to check for missing fields
- **Now:** No change to auth.ts. `profile_complete` stays as-is. Existing users keep `true`.
- **Why:** Existing users handled by wizard in-context prompt, not by the onboarding modal.

### Campaigns Nav Link
- **Was:** "Campaigns" in navbar
- **Now:** "Postcards" in navbar (with divider separating from analytics nav items)
- **Why:** Existing navbar has a "campaign selector" dropdown for analytics batch grouping. Two things called "Campaigns" is confusing. "Postcards" is the customer's word. (Emma stakeholder review)

### Save Audience (Terminal 1)
- **Was:** Save button in Step 2 targeting
- **Now:** Removed for Round 1
- **Why:** Feature saves to localStorage but can't reload — broken trust. Ship when it works end-to-end. (Hulick)

### Mock Status Progression
- **Was:** Client-side `setTimeout` (30s/60s/90s)
- **Now:** Server timestamp-based calculation using `approved_at`
- **Why:** setTimeout lost on page refresh. Timestamp persists across sessions.

## Technical Decisions

### setTargeting Flags Step 3
- Added: when targeting changes and Step 3 is already complete, flag Step 3 for review
- **Why:** Changing targeting (different recipient breakdown) could mean the postcard messaging tone is wrong

### Mobile Gate on Wizard
- Added: viewport < 768px shows "works best on a computer" message
- **Why:** Wizard is desktop-only. Without gate, mobile users see a broken layout.

### Draft URL Update
- Added: `router.replace('/app/send/' + draft.id)` after draft creation
- **Why:** Without this, refreshing `/app/send` creates duplicate drafts

### PostcardPreview Backward-Compatible Props
- All new props have default values so Terminal 3's code (written against stubs) works even before Terminal 2 merges

### Industry as Structured Enum
- Added `Industry` type: 'hvac' | 'plumbing' | 'roofing' | 'cleaning' | 'electrical' | 'pest_control' | 'landscaping' | 'other'
- **Why:** Smart filter defaults depend on exact industry values. Free text breaks the lookup.

## New Stakeholder Added

### Emma — Existing PostCanary Analytics Customer
- Uses analytics for 4 months, 12 uploaded campaigns
- Tests: "Does this break anything for someone already using the product?"
- **Why:** The Campaign model collision was caused by designing for new users without considering existing ones. Emma prevents this blind spot.
