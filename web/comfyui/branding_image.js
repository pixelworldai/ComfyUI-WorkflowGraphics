import { app } from "../../scripts/app.js";

const TYPE = "WorkflowGraphics";
const TITLE = "Workflow Graphics";

/**
 * BrandingImage draws a user-supplied base64 image onto the canvas as a virtual node.
 * It mirrors the rgthree Label node UX: adjustable via properties, double-click opens
 * the properties panel, and pinned nodes allow click-through.
 */
export class BrandingImage extends LGraphNode {
  static title = TITLE;
  static type = TYPE;
  comfyClass = TITLE;
  static title_mode = LiteGraph.NO_TITLE;
  static collapsable = false;

  static ["@imageData"] = { type: "string" };
  static ["@scalePercent"] = { type: "number" };
  static ["@opacity"] = { type: "number" };
  static ["@backgroundColor"] = { type: "string" };
  static ["@borderRadius"] = { type: "number" };

  resizable = false;

  constructor(title = BrandingImage.title) {
    super(title);
    this.properties = this.properties || {};
    this.properties["imageData"] = this.properties["imageData"] || "";
    this.properties["scalePercent"] = this.properties["scalePercent"] ?? 100;
    this.properties["opacity"] = 1.0;
    this.properties["backgroundColor"] = "transparent";
    this.properties["borderRadius"] = 0;
    this._img = null;
    this._imgNatural = { w: 64, h: 64 };
    this.color = "#fff0";
    this.bgcolor = "#fff0";
    this.widgets = this.widgets || [];
    this.properties = this.properties || {};
    this.serialize_widgets = true;
    if (!this.title || this.title === TYPE) {
      this.title = TITLE;
    }
    this.isVirtualNode = true;
  }

  get imageData() {
    return this.properties["imageData"] || "";
  }

  set imageData(v) {
    this.properties["imageData"] = v || "";
    this._loadImage();
  }

  configure(info) {
    super.configure(info);
    if (this.properties?.imageData && !this._img) {
      this._loadImage();
    }
  }

  _normalizeDataUrl(data) {
    if (!data) return "";
    const trimmed = String(data).trim();
    if (trimmed.startsWith("data:")) {
      const comma = trimmed.indexOf(",");
      if (comma === -1) return trimmed;
      const prefix = trimmed.slice(0, comma + 1);
      const payload = trimmed.slice(comma + 1).replace(/\s+/g, "");
      return prefix + payload;
    }
    return `data:image/png;base64,${trimmed.replace(/\s+/g, "")}`;
  }

  _loadImage() {
    const src = this._normalizeDataUrl(this.properties["imageData"]);
    if (!src) {
      this._img = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      this._img = img;
      this._imgNatural = { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
      this.setDirtyCanvas(true, true);
    };
    img.onerror = () => {
      this._img = null;
      this.setDirtyCanvas(true, true);
    };
    img.src = src;
  }

  draw(ctx) {
    this.flags = this.flags || {};
    this.flags.allow_interaction = !this.flags.pinned;
    this.color = "#fff0";
    this.bgcolor = "#fff0";

    const opacity = Math.max(0, Math.min(1, Number(this.properties["opacity"]) ?? 1));
    const borderRadius = Number(this.properties["borderRadius"]) || 0;
    const bg = this.properties["backgroundColor"] || "";

    // Compute draw size
    const nat = this._imgNatural;
    let w = 0;
    let h = 0;
    const legacyW = Number(this.properties["width"]) || 0;
    const legacyH = Number(this.properties["height"]) || 0;
    if (legacyW || legacyH) {
      if (legacyW && !legacyH) {
        const ratio = nat.h > 0 ? nat.h / nat.w : 1;
        w = legacyW;
        h = Math.max(1, Math.round(legacyW * ratio));
      } else if (!legacyW && legacyH) {
        const ratio = nat.w > 0 ? nat.w / nat.h : 1;
        h = legacyH;
        w = Math.max(1, Math.round(legacyH * ratio));
      } else {
        w = legacyW;
        h = legacyH;
      }
    } else {
      const scale = Math.max(0, Math.min(100, Number(this.properties["scalePercent"]) ?? 100)) / 100;
      w = Math.max(1, Math.round(nat.w * scale));
      h = Math.max(1, Math.round(nat.h * scale));
    }

    // Update node box size
    this.size[0] = Math.max(1, w);
    this.size[1] = Math.max(1, h);

    const hasBg = !!bg && bg !== "transparent";
    if (hasBg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, this.size[0], this.size[1], [borderRadius]);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
    }

    if (this._img) {
      ctx.save();
      ctx.globalAlpha = opacity;
      if (borderRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, [borderRadius]);
        ctx.clip();
      }
      ctx.drawImage(this._img, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = "#8886";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(0, 0, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = "#8888";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "12px Arial";
      ctx.fillText(TITLE, w / 2, h / 2);
      ctx.restore();
    }
  }

  onDblClick() {
    LGraphCanvas.active_canvas.showShowNodePanel(this);
  }

  inResizeCorner() {
    return this.resizable;
  }

  getHelp() {
    return `
      <p>
        The Workflow Graphics node draws a base64-encoded image directly on the canvas. Paste a data URL
        (e.g. data:image/png;base64,...) or raw base64 (assumed PNG) into the Image Data property.
      </p>
      <ul>
        <li><strong>Scale (%)</strong>: 0–100 of the image's natural size.</li>
        <li><strong>Opacity</strong>: 0..1</li>
        <li><strong>Background Color</strong>: hex or CSS color; use transparent for none.</li>
        <li><strong>Pin</strong>: use ComfyUI pin to allow click-through.</li>
      </ul>`;
  }

  onShowCustomPanelInfo(panel) {
    panel.querySelector('div.property[data-property="Mode"]')?.remove();
    panel.querySelector('div.property[data-property="Color"]')?.remove();

    const addRow = (label, inputEl) => {
      const row = document.createElement("div");
      row.className = "property";
      const title = document.createElement("span");
      title.className = "name";
      title.textContent = label;
      const value = document.createElement("div");
      value.className = "value";
      value.appendChild(inputEl);
      row.appendChild(title);
      row.appendChild(value);
      panel.appendChild(row);
    };

    const ta = document.createElement("textarea");
    ta.value = this.properties.imageData || "";
    ta.rows = 4;
    ta.placeholder = "data:image/png;base64,.... or base64";
    const applyImageData = () => {
      this.imageData = ta.value;
      this.setDirtyCanvas(true, true);
    };
    ta.addEventListener("change", applyImageData);
    ta.addEventListener("input", applyImageData);
    addRow("Image Data", ta);

    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "Reload Image";
    refreshBtn.className = "comfy-btn";
    refreshBtn.addEventListener("click", () => {
      this._loadImage();
      this.setDirtyCanvas(true, true);
    });
    addRow("Refresh", refreshBtn);

    try {
      const titleInput = panel.querySelector('div.property[data-property="Title"] input');
      if (titleInput) {
        if (this.title === TYPE) {
          this.title = TITLE;
        }
        titleInput.value = this.title;
      }
    } catch (_) {}

    const makeNumberInput = (prop, min, max, step = 1) => {
      const el = document.createElement("input");
      el.type = "number";
      if (min != null) el.min = String(min);
      if (max != null) el.max = String(max);
      el.step = String(step);
      el.value = String(this.properties[prop] ?? 0);
      const applyNumber = () => {
        const v = Number(el.value);
        this.properties[prop] = isNaN(v) ? 0 : v;
        this.setDirtyCanvas(true, true);
      };
      el.addEventListener("change", applyNumber);
      el.addEventListener("input", applyNumber);
      return el;
    };

    const scale = makeNumberInput("scalePercent", 0, 100, 1);
    const applyScale = () => {
      const v = Number(scale.value);
      this.properties.scalePercent = Math.max(0, Math.min(100, isNaN(v) ? 100 : v));
      this.setDirtyCanvas(true, true);
    };
    scale.addEventListener("change", applyScale);
    scale.addEventListener("input", applyScale);
    addRow("Scale (%)", scale);

    const op = makeNumberInput("opacity", 0, 1, 0.01);
    const applyOpacity = () => {
      const v = Number(op.value);
      this.properties.opacity = Math.max(0, Math.min(1, isNaN(v) ? 1 : v));
      this.setDirtyCanvas(true, true);
    };
    op.addEventListener("change", applyOpacity);
    op.addEventListener("input", applyOpacity);
    addRow("Opacity", op);

    const bg = document.createElement("input");
    bg.type = "text";
    bg.value = this.properties.backgroundColor || "transparent";
    bg.placeholder = "transparent | #RRGGBB[AA] | css color";
    const applyBg = () => {
      this.properties.backgroundColor = bg.value || "transparent";
      this.setDirtyCanvas(true, true);
    };
    bg.addEventListener("change", applyBg);
    bg.addEventListener("input", applyBg);
    addRow("Background Color", bg);

    addRow("Border Radius", makeNumberInput("borderRadius", 0, null, 1));
  }

  getExtraMenuOptions(canvas, options) {
    options = options || [];
    options.unshift({
      content: "Reload Workflow Graphics",
      callback: () => {
        this._loadImage();
        canvas?.setDirty(true, true);
      },
    });
    return [];
  }
}

const oldDrawNode = LGraphCanvas.prototype.drawNode;
LGraphCanvas.prototype.drawNode = function (node, ctx) {
  if (node && node.constructor === BrandingImage.prototype.constructor) {
    node.bgcolor = "transparent";
    node.color = "transparent";
    const v = oldDrawNode.apply(this, arguments);
    node.draw(ctx);
    return v;
  }
  return oldDrawNode.apply(this, arguments);
};

const oldGetNodeOnPos = LGraph.prototype.getNodeOnPos;
LGraph.prototype.getNodeOnPos = function (x, y, nodes_list) {
  if (nodes_list && LGraphCanvas.active_canvas?.last_mouseclick != null) {
    const isDoubleClick = LiteGraph.getTime() - LGraphCanvas.active_canvas.last_mouseclick < 300;
    if (!isDoubleClick) {
      nodes_list = [...nodes_list].filter((n) => !(n instanceof BrandingImage) || !n.flags?.pinned);
    }
  }
  return oldGetNodeOnPos.apply(this, [x, y, nodes_list]);
};

app.registerExtension({
  name: "WorkflowGraphics",
  registerCustomNodes() {
    const api = window.app?.api;
    try {
      api?.registerCustomNodeDefinition?.({
        name: TITLE,
        display_name: TITLE,
        category: "branding",
        input: { required: {}, optional: {} },
        output: [],
        output_name: [],
        output_is_list: [],
      });
    } catch (_) {}

    BrandingImage.category = "branding";
    LiteGraph.registerNodeType(BrandingImage.type, BrandingImage);
  },
});

window.refreshBrandingImages = function () {
  try {
    const nodes = app?.graph?._nodes || [];
    for (const n of nodes) {
      if (n && n.constructor === BrandingImage.prototype.constructor) {
        n._loadImage?.();
      }
    }
    app?.canvas?.setDirty(true, true);
  } catch (_) {}
};

