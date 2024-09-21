## [0.2.0] - 2024-09-21
- Rewrote the extension from scratch to fix some fundamental issues and reduce the complexity of the code

## [0.1.3] - 2024-07-08
### Changed
- Flipped the logic of the MUI import detector. It now checks for allowed imports to split instead of checking for disallowed imports, because apparently the list of allowed imports is much smaller than the list of disallowed imports.
### Fixed
- An import statement of an icon would be written as {module}IconIcon instead of {module}Icon

## [0.1.2] - 2024-07-04
### Added
- Limiters to stop the extension for looking for MUI imports in 2 situations:
    1. If it didn't encounter any import statements in the first 100 lines
    2. If it encounters 20 non-import lines after the last import statement

## [0.1.1] - 2024-07-04
### Fixed
- Multiple imports were incorrectly split. For a full list of the skipped imports see the Readme file

## [0.1.0] - 2024-06-18
### Added
- When a module from the "@mui/icons-material" class is imported, it will change all places where the module is called to the new module ({module}Icon)
### Changed
- Rewritten parts of the code to reduce execution time (35ms-60ms average before, 15-25ms average after)

## [0.0.7] - 2024-06-18
### Added
- Added "@mui/material/colors" and "@mui/x-date-pickers" to the ignored import paths list
### Fixed
- Items from the "@mui/icons-material" class weren't correctly imported

## [0.0.5] - 2024-06-17
### Added	
- Exceptions for imports with "@mui/material/styles" and "@mui/icons-material" so their modules are imported correctly
### Fixed
- Issue where using the shortcut didn't recognize the command

## [0.0.4] - 2024-06-14
### Added
- Setting to toggle information messages on or off for the extension in VS Code. Default is off
### Fixed
- Changes in settings were not updated in the extension until VS Code was restarted
- Run on Save didn't work when VS Code was started and the Split MUI Import command wasn't ran manually

## [0.0.3] - 2024-06-14
### Added
- Support for multiline grouped MUI imports to be detected and correctly split
### Changed
- Renamed title of the split-mui-imports command to "Split MUI Imports: split MUI imports"

## [0.0.2] - 2024-06-13
### Changed
- Updated display name from split-mui-imports to Split MUI Imports

## [0.0.1] - 2024-06-13
### Initial release
