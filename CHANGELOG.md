# Changelog

## [0.3.3]

- skip adding ignored non read-only files to the context
- improved MCP client interruption handling
- properly adding user input messages to the input history when using MCP tools
- wrapping long tool message content

## [0.3.2]

- added result of MCP tool to the tool message
- updated Claude model to 3.7 in default preferred list of models
- system prompt for MCP agent can be now configured in settings
- fixed prompt field focus issue after model selection
- properly showing preferred models in model selector when searching
- added missing vertical scrollbar when MCP server has many tools
- interpolating ${projectDir} in MCP server config `env` values
- interpolating ${projectDir} in MCP server config `args`

## [0.3.1]

- using python executable to install packages instead of pip
- added `/map` and `/map-refresh` commands for repository mapping functionality
- prevent infinite loading state after application refresh
- added AIDER_DESK_NO_AUTO_UPDATE environment variable to disable automatic updates
