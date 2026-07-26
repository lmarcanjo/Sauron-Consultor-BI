# Dynamic Area Access Control

## Single policy path

Permissions are stored only by `AreaPermissionRepository` and evaluated by
`AccessControlEngine`. A grant is scoped by:

```text
userId + groupId + companyId + areaId + actions
```

Actions are `VIEW`, `EDIT`, `CONFIGURE`, `ARCHIVE`, `DELETE` and `EXPORT`.
The repository supports both merging grants and replacing a complete grant for
one context. Removing an area revokes its scoped grants.

## Enforcement layers

1. `NavigationRegistry` hides a dynamic route without `VIEW_AREA:<areaId>`.
2. `App` resolves deep links through the registry and never renders an
   unauthorized route as active.
3. `CustomAreaViewModel` checks access before exposing the area name, fields,
   metrics, preview or rows.
4. Lifecycle handlers validate configure/archive/delete permissions before
   performing mutations.
5. Presentation generation includes only active, visible areas allowed in the
   current group/company context.

The default trusted operator roles retain the existing platform behavior. All
other roles require an explicit contextual grant. A permission update emits
`sauron:area-permissions-updated`, which refreshes the shell and sidebar.

## User-facing configuration

The existing Model Configuration area exposes the selected person and action
checkboxes. Saving replaces only that person's grant in the current context;
it never changes workbook rows, mappings or another company's permissions.

## Denied states

An unauthorized dynamic route falls back to the safe workspace route. A
direct data request still returns an access-denied ViewModel with no raw
values, so hiding a button is not the security boundary.
