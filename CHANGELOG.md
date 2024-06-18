## [0.0.6] - 2024-06-18
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
