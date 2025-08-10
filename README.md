## Workflow Graphics (ComfyUI)

Add static images to your ComfyUI canvas as non-executable overlay nodes. Useful for logos, watermarks, or visual guides inside your workflow.

### Install
- Place this folder (`ComfyUI_Workflow_Branding`) in `ComfyUI/custom_nodes/`.
- Restart ComfyUI.

### Node
- Category: `branding`
- Name: `Workflow Graphics`

### Usage
1. Add the node by searching for `Workflow Graphics`.
2. Open the node’s panel (double‑click the node or use the right‑side properties).
3. Paste an image as either:
   - A complete data URL: `data:image/png;base64,...`
   - Raw base64 (assumed PNG)
4. Adjust:
   - `Scale (%)`: 0–100 of the image’s natural size
   - `Opacity`: 0..1
   - `Background Color`: any CSS color or `transparent`
   - `Border Radius`: radius in pixels
5. Pin the node (ComfyUI pin) to allow click‑through over the canvas while keeping it visible.
6. Use the context menu item `Reload Workflow Graphics` if you manually changed the base64 and want to refresh.

Notes:
- This is a frontend‑only node; it does not participate in execution.
- The node size auto‑matches the displayed image dimensions.

### Dev helpers
In the browser console you can run `window.refreshBrandingImages()` to reload all Workflow Graphics nodes on the canvas.

### Support
If this saved you time, you can support development here: `https://ko-fi.com/pixelworldai`


