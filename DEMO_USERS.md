# Demo Users

These accounts are seeded by running:

```
python manage.py seed_demo_users
```

Emails are verified in Firebase and in the backend. Passwords are demo-only and should be rotated in production.

| Role | Profession Type | Email | Password | Notes |
| --- | --- | --- | --- | --- |
| Client | - | client@demo.buildmelk.lk | Demo@2026!Client | Client demo account |
| Professional | CONTRACTOR | contractor@demo.buildmelk.lk | Demo@2026!Contractor | Contractor demo account |
| Professional | ENGINEER | engineer@demo.buildmelk.lk | Demo@2026!Engineer | Engineer demo account |
| Professional | LAWYER | lawyer@demo.buildmelk.lk | Demo@2026!Lawyer | Lawyer demo account |
| Professional | ARCHITECT | architect@demo.buildmelk.lk | Demo@2026!Architect | Architect demo account |
| Professional | QS | qs@demo.buildmelk.lk | Demo@2026!QS | Quantity surveyor demo account |
| Professional | HARDWARE | hardware@demo.buildmelk.lk | Demo@2026!Hardware | Hardware owner demo account |
| Professional | WORKER | worker@demo.buildmelk.lk | Demo@2026!Worker | Worker demo account |
| Professional | PLUMBER | plumber@demo.buildmelk.lk | Demo@2026!Plumber | Plumber demo account |
| Professional | WELDER | welder@demo.buildmelk.lk | Demo@2026!Welder | Welder demo account |
| Professional | ELECTRICIAN | electrician@demo.buildmelk.lk | Demo@2026!Electrician | Electrician demo account |
| Professional | PAINTER | painter@demo.buildmelk.lk | Demo@2026!Painter | Painter demo account |

Hardware owner seed details:
- 2 hardware shops (Central, North)
- 10 inventory items linked to marketplace materials

If no materials exist, the command seeds a demo supplier, categories, and materials first.
