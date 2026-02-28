export type ComponentType<T extends Component> = abstract new (...args: any[]) => T;
export type ConcreteComponentType<T extends Component> = new () => T;

export class Vector2 {
  public x: number;
  public y: number;

  public constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public static get zero(): Vector2 {
    return new Vector2(0, 0);
  }

  public static get one(): Vector2 {
    return new Vector2(1, 1);
  }

  public get magnitude(): number {
    return Math.hypot(this.x, this.y);
  }

  public get normalized(): Vector2 {
    const length = this.magnitude;
    if (length <= Number.EPSILON) {
      return Vector2.zero;
    }
    return new Vector2(this.x / length, this.y / length);
  }

  public Add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  public Subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  public Multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  public Clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

export class Vector3 {
  public x: number;
  public y: number;
  public z: number;

  public constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public static get zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  public static get one(): Vector3 {
    return new Vector3(1, 1, 1);
  }

  public get magnitude(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  public get normalized(): Vector3 {
    const length = this.magnitude;
    if (length <= Number.EPSILON) {
      return Vector3.zero;
    }
    return new Vector3(this.x / length, this.y / length, this.z / length);
  }

  public Add(other: Vector3): Vector3 {
    return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  public Subtract(other: Vector3): Vector3 {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  public Multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  public Clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}

export class Color {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  public constructor(r = 1, g = 1, b = 1, a = 1) {
    this.r = Mathf.Clamp01(r);
    this.g = Mathf.Clamp01(g);
    this.b = Mathf.Clamp01(b);
    this.a = Mathf.Clamp01(a);
  }

  public static get white(): Color {
    return new Color(1, 1, 1, 1);
  }

  public static get black(): Color {
    return new Color(0, 0, 0, 1);
  }

  public static get red(): Color {
    return new Color(1, 0, 0, 1);
  }

  public static get green(): Color {
    return new Color(0, 1, 0, 1);
  }

  public static get blue(): Color {
    return new Color(0, 0, 1, 1);
  }

  public ToCss(): string {
    const rr = Math.round(this.r * 255);
    const gg = Math.round(this.g * 255);
    const bb = Math.round(this.b * 255);
    return `rgba(${rr}, ${gg}, ${bb}, ${this.a})`;
  }
}

export class Mathf {
  public static readonly PI = Math.PI;
  public static readonly Deg2Rad = Math.PI / 180;
  public static readonly Rad2Deg = 180 / Math.PI;

  public static Abs(value: number): number {
    return Math.abs(value);
  }

  public static Sin(value: number): number {
    return Math.sin(value);
  }

  public static Cos(value: number): number {
    return Math.cos(value);
  }

  public static Sqrt(value: number): number {
    return Math.sqrt(value);
  }

  public static Min(a: number, b: number): number {
    return Math.min(a, b);
  }

  public static Max(a: number, b: number): number {
    return Math.max(a, b);
  }

  public static Clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  public static Clamp01(value: number): number {
    return this.Clamp(value, 0, 1);
  }

  public static Lerp(a: number, b: number, t: number): number {
    return a + (b - a) * this.Clamp01(t);
  }
}

export class Debug {
  public static Log(message: unknown): void {
    console.log(message);
  }

  public static LogWarning(message: unknown): void {
    console.warn(message);
  }

  public static LogError(message: unknown): void {
    console.error(message);
  }

  public static Assert(condition: boolean, message = "Assertion failed"): void {
    if (!condition) {
      throw new Error(message);
    }
  }
}

export class Time {
  public static deltaTime = 0;
  public static time = 0;
  public static frameCount = 0;

  public static _SetFrame(deltaTime: number): void {
    this.deltaTime = deltaTime;
    this.time += deltaTime;
    this.frameCount += 1;
  }
}

export class Input {
  private static initialized = false;
  private static pressedKeys = new Set<string>();
  private static downKeys = new Set<string>();
  private static upKeys = new Set<string>();

  private static readonly OnKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    if (!Input.pressedKeys.has(key)) {
      Input.downKeys.add(key);
    }
    Input.pressedKeys.add(key);
  };

  private static readonly OnKeyUp = (event: KeyboardEvent): void => {
    const key = event.key;
    Input.pressedKeys.delete(key);
    Input.upKeys.add(key);
  };

  public static Initialize(hostWindow: Window): void {
    if (this.initialized) {
      return;
    }
    hostWindow.addEventListener("keydown", this.OnKeyDown);
    hostWindow.addEventListener("keyup", this.OnKeyUp);
    this.initialized = true;
  }

  public static GetKey(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  public static GetKeyDown(key: string): boolean {
    return this.downKeys.has(key);
  }

  public static GetKeyUp(key: string): boolean {
    return this.upKeys.has(key);
  }

  public static _EndFrame(): void {
    this.downKeys.clear();
    this.upKeys.clear();
  }
}

export class Object {
  private static nextInstanceId = 1;
  public readonly InstanceID: number;
  public name: string;

  public constructor(name?: string) {
    this.InstanceID = Object.nextInstanceId++;
    this.name = name ?? this.constructor.name;
  }
}

export class Component extends Object {
  private owner: GameObject | null = null;

  public get gameObject(): GameObject {
    if (this.owner === null) {
      throw new Error(`Component ${this.name} is not attached to a GameObject.`);
    }
    return this.owner;
  }

  public get transform(): Transform {
    return this.gameObject.transform;
  }

  public _Attach(owner: GameObject): void {
    this.owner = owner;
  }
}

export class Behaviour extends Component {
  public enabled = true;
}

export class MonoBehaviour extends Behaviour {
  public Awake?(): void;
  public OnEnable?(): void;
  public Start?(): void;
  public Update?(): void;
  public OnDisable?(): void;
  public OnDestroy?(): void;
}

export class Transform extends Component {
  public localPosition = Vector3.zero;
  public localScale = Vector3.one;
  public localEulerAngles = Vector3.zero;
  private parentTransform: Transform | null = null;
  private readonly children: Transform[] = [];

  public get parent(): Transform | null {
    return this.parentTransform;
  }

  public get childCount(): number {
    return this.children.length;
  }

  public get Children(): readonly Transform[] {
    return this.children;
  }

  public get position(): Vector3 {
    if (this.parentTransform === null) {
      return this.localPosition.Clone();
    }
    return this.parentTransform.position.Add(this.localPosition);
  }

  public set position(value: Vector3) {
    if (this.parentTransform === null) {
      this.localPosition = value.Clone();
      return;
    }
    this.localPosition = value.Subtract(this.parentTransform.position);
  }

  public SetParent(parent: Transform | null): void {
    if (this.parentTransform === parent) {
      return;
    }

    if (this.parentTransform !== null) {
      const index = this.parentTransform.children.indexOf(this);
      if (index >= 0) {
        this.parentTransform.children.splice(index, 1);
      }
    }

    this.parentTransform = parent;

    if (this.parentTransform !== null) {
      this.parentTransform.children.push(this);
    }
  }

  public GetChild(index: number): Transform {
    return this.children[index];
  }

  public Translate(direction: Vector3): void {
    this.position = this.position.Add(direction);
  }
}

export class GameObject extends Object {
  private readonly components: Component[] = [];
  private sceneRef: Scene | null = null;
  public readonly transform: Transform;
  public activeSelf = true;

  public constructor(name = "GameObject") {
    super(name);
    this.transform = new Transform();
    this.transform.name = "Transform";
    this.transform._Attach(this);
    this.components.push(this.transform);
  }

  public get scene(): Scene | null {
    return this.sceneRef;
  }

  public get activeInHierarchy(): boolean {
    if (!this.activeSelf) {
      return false;
    }
    const parent = this.transform.parent;
    if (parent === null) {
      return true;
    }
    return parent.gameObject.activeInHierarchy;
  }

  public SetActive(value: boolean): void {
    this.activeSelf = value;
  }

  public AddComponent<T extends Component>(componentType: ConcreteComponentType<T>): T {
    if (componentType === (Transform as unknown as ConcreteComponentType<T>)) {
      return this.transform as unknown as T;
    }

    const component = new componentType();
    component._Attach(this);
    this.components.push(component);
    this.sceneRef?._OnComponentAdded(component);
    return component;
  }

  public GetComponent<T extends Component>(componentType: ComponentType<T>): T | null {
    for (const component of this.components) {
      if (component instanceof componentType) {
        return component;
      }
    }
    return null;
  }

  public GetComponents<T extends Component>(componentType: ComponentType<T>): T[] {
    return this.components.filter((component) => component instanceof componentType) as T[];
  }

  public _GetAllComponents(): readonly Component[] {
    return this.components;
  }

  public _SetScene(scene: Scene | null): void {
    this.sceneRef = scene;
    for (const child of this.transform.Children) {
      child.gameObject._SetScene(scene);
    }
  }
}

export abstract class Renderer extends Behaviour {
  public abstract Render(context: CanvasRenderingContext2D): void;
}

export class SpriteRenderer extends Renderer {
  public Size = new Vector2(72, 72);
  public Color: Color | string = Color.green;
  public Pivot = new Vector2(0.5, 0.5);

  public override Render(context: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.gameObject.activeInHierarchy) {
      return;
    }

    const worldPosition = this.transform.position;
    const scale = this.transform.localScale;
    const width = this.Size.x * scale.x;
    const height = this.Size.y * scale.y;
    const color = typeof this.Color === "string" ? this.Color : this.Color.ToCss();
    context.fillStyle = color;
    context.fillRect(
      worldPosition.x - width * this.Pivot.x,
      worldPosition.y - height * this.Pivot.y,
      width,
      height,
    );
  }
}

export class UnityEvent<TArgs extends unknown[] = []> {
  private readonly listeners = new Set<(...args: TArgs) => void>();

  public AddListener(listener: (...args: TArgs) => void): void {
    this.listeners.add(listener);
  }

  public RemoveListener(listener: (...args: TArgs) => void): void {
    this.listeners.delete(listener);
  }

  public RemoveAllListeners(): void {
    this.listeners.clear();
  }

  public Invoke(...args: TArgs): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}

export type UILayoutMode = "absolute" | "flow";

export class RectTransform extends Component {
  public anchoredPosition = Vector2.zero;
  public sizeDelta = Vector2.zero;
  public pivot = new Vector2(0.5, 0.5);
}

export abstract class UIBehaviour<TElement extends HTMLElement = HTMLElement> extends MonoBehaviour {
  public LayoutMode: UILayoutMode = "absolute";
  public Visible = true;
  public Interactable = true;

  private attachedParent: HTMLElement | null = null;
  private cachedRectTransform: RectTransform | null = null;
  protected domElement: TElement | null = null;

  public get Element(): TElement {
    this.EnsureDomElement();
    return this.domElement as TElement;
  }

  public get ContentElement(): HTMLElement {
    return this.GetContentElement();
  }

  protected abstract CreateElement(): TElement;

  protected GetContentElement(): HTMLElement {
    return this.Element;
  }

  protected OnApplyStyle(_element: TElement): void {}

  protected ApplyRectTransformStyle(element: TElement): void {
    const rectTransform = this.GetRectTransform();
    const width = rectTransform.sizeDelta.x;
    const height = rectTransform.sizeDelta.y;

    if (width > 0) {
      element.style.width = `${width}px`;
    } else {
      element.style.removeProperty("width");
    }

    if (height > 0) {
      element.style.height = `${height}px`;
    } else {
      element.style.removeProperty("height");
    }

    if (this.LayoutMode === "absolute") {
      element.style.position = "absolute";
      element.style.left = `${rectTransform.anchoredPosition.x}px`;
      element.style.top = `${rectTransform.anchoredPosition.y}px`;
      element.style.transform = `translate(${-rectTransform.pivot.x * 100}%, ${-rectTransform.pivot.y * 100}%)`;
      return;
    }

    element.style.position = "relative";
    element.style.removeProperty("left");
    element.style.removeProperty("top");
    element.style.removeProperty("transform");
  }

  public override Awake(): void {
    this.EnsureDomElement();
    this.RefreshParentBinding();
    this.RefreshStyle();
  }

  public override Start(): void {
    this.RefreshParentBinding();
    this.RefreshStyle();
  }

  public override Update(): void {
    this.RefreshParentBinding();
    this.RefreshStyle();
  }

  public override OnEnable(): void {
    this.RefreshStyle();
  }

  public override OnDisable(): void {
    if (this.domElement !== null) {
      this.domElement.hidden = true;
    }
  }

  public override OnDestroy(): void {
    if (this.domElement !== null) {
      this.domElement.remove();
      this.domElement = null;
      this.attachedParent = null;
    }
  }

  protected GetRectTransform(): RectTransform {
    if (this.cachedRectTransform !== null) {
      return this.cachedRectTransform;
    }

    let rectTransform = this.gameObject.GetComponent(RectTransform);
    if (rectTransform === null) {
      rectTransform = this.gameObject.AddComponent(RectTransform);
    }
    this.cachedRectTransform = rectTransform;
    return rectTransform;
  }

  private EnsureDomElement(): void {
    if (this.domElement !== null) {
      return;
    }
    const element = this.CreateElement();
    element.style.boxSizing = "border-box";
    element.style.userSelect = "none";
    this.domElement = element;
  }

  private RefreshParentBinding(): void {
    this.EnsureDomElement();
    const parentElement = this.ResolveParentElement();
    if (parentElement === null || this.domElement === null) {
      return;
    }

    if (this.attachedParent === parentElement && this.domElement.parentElement === parentElement) {
      return;
    }

    parentElement.appendChild(this.domElement);
    this.attachedParent = parentElement;
  }

  private ResolveParentElement(): HTMLElement | null {
    const parentTransform = this.transform.parent;
    if (parentTransform !== null) {
      const parentGameObject = parentTransform.gameObject;
      const parentScrollRect = parentGameObject.GetComponent(ScrollRect);
      if (parentScrollRect !== null) {
        return parentScrollRect.ContentElement;
      }

      const parentCanvas = parentGameObject.GetComponent(Canvas);
      if (parentCanvas !== null) {
        return parentCanvas.ContentElement;
      }

      const parentPanel = parentGameObject.GetComponent(Panel);
      if (parentPanel !== null) {
        return parentPanel.ContentElement;
      }

      const parentImage = parentGameObject.GetComponent(Image);
      if (parentImage !== null) {
        return parentImage.ContentElement;
      }
    }

    const scene = this.gameObject.scene;
    if (scene === null || scene.engine === null) {
      return null;
    }

    const canvases = scene.GetComponentsInScene(Canvas);
    const parentCanvas = canvases.find((canvas) => canvas.gameObject !== this.gameObject);
    if (parentCanvas !== undefined) {
      return parentCanvas.ContentElement;
    }
    return scene.engine.UIRootElement;
  }

  private RefreshStyle(): void {
    if (this.domElement === null) {
      return;
    }

    const isVisible = this.Visible && this.enabled && this.gameObject.activeInHierarchy;
    this.domElement.hidden = !isVisible;
    if (!isVisible) {
      return;
    }

    this.domElement.style.pointerEvents = this.Interactable ? "auto" : "none";
    this.ApplyRectTransformStyle(this.domElement);
    this.OnApplyStyle(this.domElement);
  }
}

export class Canvas extends UIBehaviour<HTMLDivElement> {
  public BackgroundColor = "transparent";

  protected override CreateElement(): HTMLDivElement {
    return document.createElement("div");
  }

  protected override ApplyRectTransformStyle(element: HTMLDivElement): void {
    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.transform = "none";
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.style.display = "block";
    element.style.background = this.BackgroundColor;
  }
}

export type UIAxisAlignment = "flex-start" | "center" | "flex-end" | "stretch" | "space-between" | "space-around";

export class Panel extends UIBehaviour<HTMLDivElement> {
  public Direction: "row" | "column" = "column";
  public Gap = 0;
  public Padding = 0;
  public BackgroundColor = "transparent";
  public BorderColor = "transparent";
  public BorderWidth = 0;
  public BorderRadius = 0;
  public AlignItems: UIAxisAlignment = "stretch";
  public JustifyContent: UIAxisAlignment = "flex-start";
  public OverflowX: "visible" | "hidden" | "auto" = "visible";
  public OverflowY: "visible" | "hidden" | "auto" = "visible";

  protected override CreateElement(): HTMLDivElement {
    return document.createElement("div");
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.style.display = "flex";
    element.style.flexDirection = this.Direction;
    element.style.gap = `${this.Gap}px`;
    element.style.padding = `${this.Padding}px`;
    element.style.alignItems = this.AlignItems;
    element.style.justifyContent = this.JustifyContent;
    element.style.background = this.BackgroundColor;
    element.style.borderColor = this.BorderColor;
    element.style.borderStyle = this.BorderWidth > 0 ? "solid" : "none";
    element.style.borderWidth = `${this.BorderWidth}px`;
    element.style.borderRadius = `${this.BorderRadius}px`;
    element.style.overflowX = this.OverflowX;
    element.style.overflowY = this.OverflowY;
  }
}

export class Text extends UIBehaviour<HTMLDivElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public override Interactable = false;
  public Value = "";
  public FontSize = 16;
  public FontWeight = "400";
  public Color = "#ffffff";
  public TextAlign: "left" | "center" | "right" = "left";

  protected override CreateElement(): HTMLDivElement {
    return document.createElement("div");
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.textContent = this.Value;
    element.style.fontSize = `${this.FontSize}px`;
    element.style.fontWeight = this.FontWeight;
    element.style.color = this.Color;
    element.style.textAlign = this.TextAlign;
    element.style.whiteSpace = "pre-wrap";
  }
}

export class Button extends UIBehaviour<HTMLButtonElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public Label = "Button";
  public FontSize = 16;
  public TextColor = "#ffffff";
  public BackgroundColor = "#2e7dff";
  public BorderColor = "#2e7dff";
  public BorderWidth = 1;
  public BorderRadius = 8;
  public Padding = "10px 16px";
  public readonly OnClick = new UnityEvent<[]>();

  private readonly HandleClick = (): void => {
    this.OnClick.Invoke();
  };

  protected override CreateElement(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    return button;
  }

  public override Awake(): void {
    super.Awake();
    this.Element.addEventListener("click", this.HandleClick);
  }

  public override OnDestroy(): void {
    if (this.domElement !== null) {
      this.domElement.removeEventListener("click", this.HandleClick);
    }
    super.OnDestroy();
  }

  protected override OnApplyStyle(element: HTMLButtonElement): void {
    element.textContent = this.Label;
    element.style.fontSize = `${this.FontSize}px`;
    element.style.color = this.TextColor;
    element.style.background = this.BackgroundColor;
    element.style.borderColor = this.BorderColor;
    element.style.borderWidth = `${this.BorderWidth}px`;
    element.style.borderStyle = this.BorderWidth > 0 ? "solid" : "none";
    element.style.borderRadius = `${this.BorderRadius}px`;
    element.style.padding = this.Padding;
    element.style.cursor = this.Interactable ? "pointer" : "not-allowed";
    element.disabled = !this.Interactable;
  }
}

export class InputField extends UIBehaviour<HTMLInputElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public Text = "";
  public Placeholder = "";
  public InputType: "text" | "email" | "tel" | "password" = "text";
  public FontSize = 16;
  public TextColor = "#f3f6ff";
  public BackgroundColor = "#1e2230";
  public BorderColor = "#3f4863";
  public BorderRadius = 8;
  public Padding = "10px 12px";
  public readonly OnValueChanged = new UnityEvent<[string]>();

  private readonly HandleInput = (): void => {
    const value = this.Element.value;
    this.Text = value;
    this.OnValueChanged.Invoke(value);
  };

  protected override CreateElement(): HTMLInputElement {
    return document.createElement("input");
  }

  public override Awake(): void {
    super.Awake();
    this.Element.addEventListener("input", this.HandleInput);
  }

  public override OnDestroy(): void {
    if (this.domElement !== null) {
      this.domElement.removeEventListener("input", this.HandleInput);
    }
    super.OnDestroy();
  }

  protected override OnApplyStyle(element: HTMLInputElement): void {
    element.type = this.InputType;
    element.placeholder = this.Placeholder;
    if (element.value !== this.Text) {
      element.value = this.Text;
    }
    element.style.fontSize = `${this.FontSize}px`;
    element.style.color = this.TextColor;
    element.style.background = this.BackgroundColor;
    element.style.borderColor = this.BorderColor;
    element.style.borderWidth = "1px";
    element.style.borderStyle = "solid";
    element.style.borderRadius = `${this.BorderRadius}px`;
    element.style.padding = this.Padding;
    element.disabled = !this.Interactable;
  }
}

export class Image extends UIBehaviour<HTMLDivElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public BackgroundColor = "#2a2f44";
  public BorderColor = "#5c647f";
  public BorderWidth = 1;
  public BorderRadius = 12;
  public SpriteUrl: string | null = null;
  public BackgroundSize = "cover";
  public BackgroundPosition = "center";

  protected override CreateElement(): HTMLDivElement {
    return document.createElement("div");
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.style.background = this.BackgroundColor;
    element.style.borderColor = this.BorderColor;
    element.style.borderStyle = this.BorderWidth > 0 ? "solid" : "none";
    element.style.borderWidth = `${this.BorderWidth}px`;
    element.style.borderRadius = `${this.BorderRadius}px`;
    if (this.SpriteUrl !== null) {
      element.style.backgroundImage = `url("${this.SpriteUrl}")`;
      element.style.backgroundSize = this.BackgroundSize;
      element.style.backgroundPosition = this.BackgroundPosition;
      element.style.backgroundRepeat = "no-repeat";
    } else {
      element.style.removeProperty("background-image");
    }
  }
}

export class ScrollRect extends UIBehaviour<HTMLDivElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public Horizontal = true;
  public Vertical = false;
  public ContentGap = 12;
  public Padding = 8;
  public BackgroundColor = "rgba(0, 0, 0, 0.15)";
  private contentElement: HTMLDivElement | null = null;

  public override Interactable = true;

  public override get ContentElement(): HTMLDivElement {
    this.EnsureContentElement();
    return this.contentElement as HTMLDivElement;
  }

  protected override CreateElement(): HTMLDivElement {
    const viewport = document.createElement("div");
    const content = document.createElement("div");
    viewport.appendChild(content);
    this.contentElement = content;
    return viewport;
  }

  protected override GetContentElement(): HTMLElement {
    return this.ContentElement;
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.style.display = "block";
    element.style.background = this.BackgroundColor;
    element.style.overflowX = this.Horizontal ? "auto" : "hidden";
    element.style.overflowY = this.Vertical ? "auto" : "hidden";
    element.style.scrollBehavior = "smooth";

    const content = this.ContentElement;
    content.style.display = "flex";
    content.style.flexDirection = this.Horizontal ? "row" : "column";
    content.style.gap = `${this.ContentGap}px`;
    content.style.padding = `${this.Padding}px`;
    content.style.alignItems = "stretch";
    content.style.width = this.Horizontal ? "max-content" : "100%";
    content.style.minHeight = this.Horizontal ? "100%" : "0";
  }

  private EnsureContentElement(): void {
    if (this.contentElement !== null) {
      return;
    }
    this.Element;
  }
}

type MonoState = {
  awake: boolean;
  started: boolean;
  enabledInHierarchy: boolean;
};

export class Scene {
  private readonly rootGameObjects: GameObject[] = [];
  private readonly monoState = new WeakMap<MonoBehaviour, MonoState>();
  private engineRef: Engine | null = null;

  public get engine(): Engine | null {
    return this.engineRef;
  }

  public AddGameObject(gameObject: GameObject): void {
    if (gameObject.scene !== null && gameObject.scene !== this) {
      throw new Error(`GameObject "${gameObject.name}" already belongs to another scene.`);
    }
    if (!this.rootGameObjects.includes(gameObject)) {
      this.rootGameObjects.push(gameObject);
    }
    gameObject._SetScene(this);
    this.RegisterMonoBehavioursFor(gameObject);
  }

  public GetComponentsInScene<T extends Component>(componentType: ComponentType<T>): T[] {
    const components: T[] = [];
    for (const gameObject of this.GetAllGameObjects()) {
      components.push(...gameObject.GetComponents(componentType));
    }
    return components;
  }

  public _SetEngine(engine: Engine): void {
    this.engineRef = engine;
  }

  public _OnComponentAdded(component: Component): void {
    if (!(component instanceof MonoBehaviour)) {
      return;
    }
    this.monoState.set(component, {
      awake: false,
      started: false,
      enabledInHierarchy: false,
    });
  }

  public _TickLifecycle(): void {
    const monoBehaviours = this.GetComponentsInScene(MonoBehaviour);
    for (const behaviour of monoBehaviours) {
      const state = this.EnsureState(behaviour);
      const isGameObjectActive = behaviour.gameObject.activeInHierarchy;
      if (!state.awake && isGameObjectActive) {
        behaviour.Awake?.();
        state.awake = true;
      }

      const shouldEnable = state.awake && isGameObjectActive && behaviour.enabled;
      if (shouldEnable && !state.enabledInHierarchy) {
        behaviour.OnEnable?.();
        state.enabledInHierarchy = true;
      }

      if (shouldEnable && !state.started) {
        behaviour.Start?.();
        state.started = true;
      }

      if (shouldEnable) {
        behaviour.Update?.();
      }

      if (state.enabledInHierarchy && !shouldEnable) {
        behaviour.OnDisable?.();
        state.enabledInHierarchy = false;
      }
    }
  }

  private RegisterMonoBehavioursFor(gameObject: GameObject): void {
    for (const component of gameObject._GetAllComponents()) {
      if (!(component instanceof MonoBehaviour)) {
        continue;
      }
      this.monoState.set(component, {
        awake: false,
        started: false,
        enabledInHierarchy: false,
      });
    }
  }

  private EnsureState(behaviour: MonoBehaviour): MonoState {
    const existing = this.monoState.get(behaviour);
    if (existing !== undefined) {
      return existing;
    }

    const created: MonoState = {
      awake: false,
      started: false,
      enabledInHierarchy: false,
    };
    this.monoState.set(behaviour, created);
    return created;
  }

  private GetAllGameObjects(): GameObject[] {
    const all: GameObject[] = [];
    for (const root of this.rootGameObjects) {
      this.CollectGameObjects(root, all);
    }
    return all;
  }

  private CollectGameObjects(current: GameObject, all: GameObject[]): void {
    all.push(current);
    for (const child of current.transform.Children) {
      this.CollectGameObjects(child.gameObject, all);
    }
  }
}

export class Engine {
  private readonly context: CanvasRenderingContext2D;
  private readonly hostWindow: Window | null;
  private readonly uiRootElement: HTMLDivElement | null;
  private running = false;
  private previousTimestamp = 0;
  private frameHandle = -1;
  public readonly scene: Scene;

  public get UIRootElement(): HTMLDivElement | null {
    return this.uiRootElement;
  }

  public constructor(canvas: HTMLCanvasElement, scene = new Scene()) {
    this.scene = scene;
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Engine requires a 2D canvas context.");
    }

    this.context = context;
    this.hostWindow = canvas.ownerDocument.defaultView;
    this.uiRootElement = this.InitializeUIRoot(canvas);
    this.scene._SetEngine(this);

    if (this.hostWindow !== null) {
      Input.Initialize(this.hostWindow);
    } else {
      Debug.LogWarning("Window is not available. Input API will not receive keyboard events.");
    }
  }

  public Start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.previousTimestamp = this.GetNow();
    this.frameHandle = this.ScheduleNextFrame(this.Loop);
  }

  public Stop(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.CancelFrame(this.frameHandle);
  }

  private readonly Loop = (timestamp: number): void => {
    if (!this.running) {
      return;
    }

    const deltaSeconds = (timestamp - this.previousTimestamp) / 1000;
    this.previousTimestamp = timestamp;
    Time._SetFrame(deltaSeconds);
    this.scene._TickLifecycle();
    this.Render();
    Input._EndFrame();
    this.frameHandle = this.ScheduleNextFrame(this.Loop);
  };

  private Render(): void {
    const canvas = this.context.canvas;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    const renderers = this.scene.GetComponentsInScene(Renderer);
    for (const renderer of renderers) {
      if (!renderer.enabled || !renderer.gameObject.activeInHierarchy) {
        continue;
      }
      renderer.Render(this.context);
    }
  }

  private InitializeUIRoot(canvas: HTMLCanvasElement): HTMLDivElement | null {
    const currentParent = canvas.parentElement;
    if (currentParent === null) {
      return null;
    }

    let container: HTMLElement = currentParent;
    if (currentParent.dataset.h5unityCanvasContainer !== "true") {
      container = canvas.ownerDocument.createElement("div");
      container.dataset.h5unityCanvasContainer = "true";
      container.style.position = "relative";
      container.style.width = `${canvas.width}px`;
      container.style.height = `${canvas.height}px`;
      canvas.style.display = "block";
      currentParent.insertBefore(container, canvas);
      container.appendChild(canvas);
    }

    for (const child of Array.from(container.children)) {
      if (child instanceof HTMLDivElement && child.dataset.h5unityUiRoot === "true") {
        return child;
      }
    }

    const uiRoot = canvas.ownerDocument.createElement("div");
    uiRoot.dataset.h5unityUiRoot = "true";
    uiRoot.style.position = "absolute";
    uiRoot.style.left = "0";
    uiRoot.style.top = "0";
    uiRoot.style.width = "100%";
    uiRoot.style.height = "100%";
    uiRoot.style.overflow = "hidden";
    uiRoot.style.zIndex = "10";
    uiRoot.style.pointerEvents = "none";
    container.appendChild(uiRoot);
    return uiRoot;
  }

  private ScheduleNextFrame(callback: (timestamp: number) => void): number {
    if (this.hostWindow !== null) {
      return this.hostWindow.requestAnimationFrame(callback);
    }

    return setTimeout(() => callback(this.GetNow()), 16) as unknown as number;
  }

  private CancelFrame(handle: number): void {
    if (this.hostWindow !== null) {
      this.hostWindow.cancelAnimationFrame(handle);
      return;
    }
    clearTimeout(handle);
  }

  private GetNow(): number {
    if (typeof performance !== "undefined") {
      return performance.now();
    }
    return Date.now();
  }
}

export const UnityEngine = {
  Object,
  Component,
  Behaviour,
  MonoBehaviour,
  GameObject,
  Transform,
  RectTransform,
  Renderer,
  SpriteRenderer,
  UnityEvent,
  UIBehaviour,
  Canvas,
  Panel,
  Text,
  Button,
  InputField,
  Image,
  ScrollRect,
  Scene,
  Engine,
  Debug,
  Time,
  Input,
  Mathf,
  Color,
  Vector2,
  Vector3,
};
