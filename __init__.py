"""
@author: custom
@title: Workflow Branding
@nickname: branding
@description: Virtual nodes to add branding elements to the ComfyUI canvas. Includes a base64 image label node.
"""

# No backend nodes are required; this package only exposes a web extension.

# Any .js file in this directory will be auto-loaded by ComfyUI as a frontend extension.
WEB_DIRECTORY = "./web/comfyui"

# Keep mappings empty; this package doesn't register server-side nodes.
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["WEB_DIRECTORY", "NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

