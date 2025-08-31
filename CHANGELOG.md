# Changelog

## 4.0.0

Drop support for nodejs < 18.
From this version, we support http_proxy and https_proxy.

Note: `axios` was removed and migrated to native fetch (Node.js 18+ required).


## 3.0.2

After this version, the database directory which includes `postcode` is changed.
The database is **automatically updated when changing from v2 to v3**.


## 3.0.0 Remake postcode database

If you use `postcode` field, you need to update database after updating to v3.
(As above, **it will automatically updates after v3.0.2**)

Previous v2 has troubles as #21 with some postcodes.
To fix them, we remake database structure for postcode.


## 2.0.0 Auto-update and create database at initial run.

Automatic updates and creation of databases at initial runtime have been added by default.
While many users will not need to make any changes, this is a major update as it may have made a difference in usage for some.

- Add new CLI parameter ILA_AUTO_UPDATE which updates database twice weekly with default setting and you can set cron format.
- Create database at initial run.
