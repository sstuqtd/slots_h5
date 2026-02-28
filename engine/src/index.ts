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

export type WrapMode = "Clamp" | "Loop" | "PingPong";

export class Keyframe {
  public time: number;
  public value: number;
  public inTangent: number;
  public outTangent: number;

  public constructor(time: number, value: number, inTangent = 0, outTangent = 0) {
    this.time = time;
    this.value = value;
    this.inTangent = inTangent;
    this.outTangent = outTangent;
  }

  public Clone(): Keyframe {
    return new Keyframe(this.time, this.value, this.inTangent, this.outTangent);
  }
}

export class AnimationCurve {
  private readonly keys: Keyframe[] = [];
  public preWrapMode: WrapMode = "Clamp";
  public postWrapMode: WrapMode = "Clamp";

  public constructor(keys: readonly Keyframe[] = [new Keyframe(0, 0), new Keyframe(1, 1)]) {
    this.keys = keys.map((keyframe) => keyframe.Clone());
    this.SortKeys();
  }

  public get length(): number {
    return this.keys.length;
  }

  public get Keys(): readonly Keyframe[] {
    return this.keys;
  }

  public Clone(): AnimationCurve {
    const clone = new AnimationCurve(this.keys);
    clone.preWrapMode = this.preWrapMode;
    clone.postWrapMode = this.postWrapMode;
    return clone;
  }

  public Evaluate(time: number): number {
    if (this.keys.length === 0) {
      return 0;
    }
    if (this.keys.length === 1) {
      return this.keys[0].value;
    }

    const first = this.keys[0];
    const last = this.keys[this.keys.length - 1];
    const wrappedTime = this.ApplyWrap(time, first.time, last.time);
    if (wrappedTime <= first.time) {
      return first.value;
    }
    if (wrappedTime >= last.time) {
      return last.value;
    }

    const rightIndex = this.FindRightKeyIndex(wrappedTime);
    const leftKey = this.keys[rightIndex - 1];
    const rightKey = this.keys[rightIndex];
    return this.EvaluateSegment(leftKey, rightKey, wrappedTime);
  }

  public AddKey(time: number, value: number, inTangent = 0, outTangent = 0): number {
    const key = new Keyframe(time, value, inTangent, outTangent);
    this.keys.push(key);
    this.SortKeys();
    return this.keys.indexOf(key);
  }

  public GetKey(index: number): Keyframe {
    return this.keys[index].Clone();
  }

  public SetKey(index: number, key: Keyframe): void {
    this.keys[index] = key.Clone();
    this.SortKeys();
  }

  public MoveKey(index: number, time: number, value: number): number {
    const existing = this.keys[index];
    existing.time = time;
    existing.value = value;
    this.SortKeys();
    return this.keys.indexOf(existing);
  }

  public RemoveKey(index: number): void {
    this.keys.splice(index, 1);
  }

  public SortKeys(): void {
    this.keys.sort((left, right) => left.time - right.time);
  }

  public SmoothTangents(index: number): void {
    const length = this.keys.length;
    if (length === 0 || index < 0 || index >= length) {
      return;
    }

    if (length === 1) {
      this.keys[index].inTangent = 0;
      this.keys[index].outTangent = 0;
      return;
    }

    if (index === 0) {
      const current = this.keys[index];
      const next = this.keys[index + 1];
      const slope = this.ComputeSlope(current, next);
      current.inTangent = slope;
      current.outTangent = slope;
      return;
    }

    if (index === length - 1) {
      const previous = this.keys[index - 1];
      const current = this.keys[index];
      const slope = this.ComputeSlope(previous, current);
      current.inTangent = slope;
      current.outTangent = slope;
      return;
    }

    const previous = this.keys[index - 1];
    const next = this.keys[index + 1];
    const current = this.keys[index];
    const dt = next.time - previous.time;
    const slope = Math.abs(dt) <= Number.EPSILON ? 0 : (next.value - previous.value) / dt;
    current.inTangent = slope;
    current.outTangent = slope;
  }

  public SmoothAllTangents(): void {
    for (let index = 0; index < this.keys.length; index += 1) {
      this.SmoothTangents(index);
    }
  }

  private ApplyWrap(time: number, minTime: number, maxTime: number): number {
    if (time < minTime) {
      return this.WrapTimeByMode(time, minTime, maxTime, this.preWrapMode);
    }
    if (time > maxTime) {
      return this.WrapTimeByMode(time, minTime, maxTime, this.postWrapMode);
    }
    return time;
  }

  private WrapTimeByMode(time: number, minTime: number, maxTime: number, mode: WrapMode): number {
    if (mode === "Clamp") {
      return Mathf.Clamp(time, minTime, maxTime);
    }

    const range = maxTime - minTime;
    if (Math.abs(range) <= Number.EPSILON) {
      return minTime;
    }

    if (mode === "Loop") {
      return minTime + this.Repeat(time - minTime, range);
    }

    return minTime + this.PingPong(time - minTime, range);
  }

  private Repeat(value: number, length: number): number {
    return value - Math.floor(value / length) * length;
  }

  private PingPong(value: number, length: number): number {
    const wrapped = this.Repeat(value, length * 2);
    return length - Math.abs(wrapped - length);
  }

  private FindRightKeyIndex(time: number): number {
    let low = 1;
    let high = this.keys.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.keys[mid].time < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return low;
  }

  private EvaluateSegment(left: Keyframe, right: Keyframe, time: number): number {
    const dt = right.time - left.time;
    if (Math.abs(dt) <= Number.EPSILON) {
      return left.value;
    }

    const t = (time - left.time) / dt;
    const t2 = t * t;
    const t3 = t2 * t;

    const outTangent = Number.isFinite(left.outTangent)
      ? left.outTangent
      : this.ComputeSlope(left, right);
    const inTangent = Number.isFinite(right.inTangent)
      ? right.inTangent
      : this.ComputeSlope(left, right);
    const m0 = outTangent * dt;
    const m1 = inTangent * dt;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return h00 * left.value + h10 * m0 + h01 * right.value + h11 * m1;
  }

  private ComputeSlope(left: Keyframe, right: Keyframe): number {
    const dt = right.time - left.time;
    if (Math.abs(dt) <= Number.EPSILON) {
      return 0;
    }
    return (right.value - left.value) / dt;
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

type CurveRange = {
  timeMin: number;
  timeMax: number;
  valueMin: number;
  valueMax: number;
};

type CurveViewport = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export class CurveEditor extends UIBehaviour<HTMLDivElement> {
  public override LayoutMode: UILayoutMode = "flow";
  public AutoFrame = true;
  public TimeRange = new Vector2(0, 1);
  public ValueRange = new Vector2(0, 1);
  public BackgroundColor = "rgba(12, 17, 32, 0.95)";
  public GridColor = "rgba(122, 141, 191, 0.28)";
  public AxisColor = "rgba(185, 200, 240, 0.8)";
  public CurveColor = "#78e7b2";
  public KeyColor = "#d9e3ff";
  public SelectedKeyColor = "#ffd76a";
  public Curve = new AnimationCurve([new Keyframe(0, 0), new Keyframe(1, 1)]);
  public readonly OnCurveChanged = new UnityEvent<[AnimationCurve]>();

  private canvasElement: HTMLCanvasElement | null = null;
  private infoElement: HTMLDivElement | null = null;
  private draggingKeyIndex: number | null = null;
  private dragRange: CurveRange | null = null;

  private readonly HandlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    const point = this.GetCanvasPoint(event);
    if (point === null) {
      return;
    }

    const range = this.GetEditorRange();
    const viewport = this.GetViewport();
    const hitIndex = this.FindNearestKeyIndex(point, range, viewport, 10);
    if (hitIndex === null) {
      return;
    }

    this.draggingKeyIndex = hitIndex;
    this.dragRange = range;
    this.canvasElement?.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private readonly HandlePointerMove = (event: PointerEvent): void => {
    if (this.draggingKeyIndex === null) {
      return;
    }

    const point = this.GetCanvasPoint(event);
    if (point === null) {
      return;
    }

    const range = this.dragRange ?? this.GetEditorRange();
    const viewport = this.GetViewport();
    const time = this.MapXToTime(point.x, range, viewport);
    const value = this.MapYToValue(point.y, range, viewport);
    this.draggingKeyIndex = this.Curve.MoveKey(this.draggingKeyIndex, time, value);
    this.Curve.SmoothAllTangents();
    this.EmitCurveChanged();
    this.DrawEditor();
  };

  private readonly HandlePointerUp = (): void => {
    this.draggingKeyIndex = null;
    this.dragRange = null;
  };

  private readonly HandleDoubleClick = (event: MouseEvent): void => {
    const point = this.GetCanvasPoint(event);
    if (point === null) {
      return;
    }

    const range = this.GetEditorRange();
    const viewport = this.GetViewport();
    const time = this.MapXToTime(point.x, range, viewport);
    const value = this.MapYToValue(point.y, range, viewport);
    this.Curve.AddKey(time, value);
    this.Curve.SmoothAllTangents();
    this.EmitCurveChanged();
    this.DrawEditor();
  };

  private readonly HandleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    const point = this.GetCanvasPoint(event);
    if (point === null || this.Curve.length <= 2) {
      return;
    }

    const range = this.GetEditorRange();
    const viewport = this.GetViewport();
    const hitIndex = this.FindNearestKeyIndex(point, range, viewport, 10);
    if (hitIndex === null) {
      return;
    }
    this.Curve.RemoveKey(hitIndex);
    this.Curve.SmoothAllTangents();
    this.EmitCurveChanged();
    this.DrawEditor();
  };

  public SetCurve(curve: AnimationCurve): void {
    this.Curve = curve.Clone();
    this.Curve.SortKeys();
    this.DrawEditor();
  }

  public GetCurve(): AnimationCurve {
    return this.Curve.Clone();
  }

  protected override CreateElement(): HTMLDivElement {
    const container = document.createElement("div");
    const info = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.width = 460;
    canvas.height = 260;
    canvas.style.width = "100%";
    canvas.style.height = "260px";
    canvas.style.touchAction = "none";
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("pointerdown", this.HandlePointerDown);
    canvas.addEventListener("pointermove", this.HandlePointerMove);
    canvas.addEventListener("pointerup", this.HandlePointerUp);
    canvas.addEventListener("pointercancel", this.HandlePointerUp);
    canvas.addEventListener("dblclick", this.HandleDoubleClick);
    canvas.addEventListener("contextmenu", this.HandleContextMenu);
    container.appendChild(info);
    container.appendChild(canvas);
    this.infoElement = info;
    this.canvasElement = canvas;
    return container;
  }

  public override OnDestroy(): void {
    if (this.canvasElement !== null) {
      this.canvasElement.removeEventListener("pointerdown", this.HandlePointerDown);
      this.canvasElement.removeEventListener("pointermove", this.HandlePointerMove);
      this.canvasElement.removeEventListener("pointerup", this.HandlePointerUp);
      this.canvasElement.removeEventListener("pointercancel", this.HandlePointerUp);
      this.canvasElement.removeEventListener("dblclick", this.HandleDoubleClick);
      this.canvasElement.removeEventListener("contextmenu", this.HandleContextMenu);
    }
    super.OnDestroy();
  }

  protected override OnApplyStyle(element: HTMLDivElement): void {
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.gap = "8px";
    element.style.padding = "10px";
    element.style.background = this.BackgroundColor;
    element.style.border = "1px solid rgba(110, 125, 175, 0.45)";
    element.style.borderRadius = "10px";
    element.style.minHeight = "304px";

    if (this.infoElement !== null) {
      this.infoElement.style.fontSize = "12px";
      this.infoElement.style.color = "#b7c5f0";
      this.infoElement.style.fontFamily = "monospace";
    }

    this.DrawEditor();
  }

  private EmitCurveChanged(): void {
    this.OnCurveChanged.Invoke(this.Curve.Clone());
  }

  private DrawEditor(): void {
    const canvas = this.canvasElement;
    if (canvas === null) {
      return;
    }

    const containerWidth = canvas.clientWidth > 0 ? canvas.clientWidth : 460;
    const containerHeight = canvas.clientHeight > 0 ? canvas.clientHeight : 260;
    const width = Math.max(220, Math.floor(containerWidth));
    const height = Math.max(180, Math.floor(containerHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    const range = this.dragRange ?? this.GetEditorRange();
    const viewport = this.GetViewport();
    this.DrawBackground(context, canvas, viewport);
    this.DrawGrid(context, range, viewport);
    this.DrawCurve(context, range, viewport);
    this.DrawKeys(context, range, viewport);
    this.UpdateInfo(range);
  }

  private DrawBackground(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    viewport: CurveViewport,
  ): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(5, 9, 18, 0.75)";
    context.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);
    context.strokeStyle = "rgba(120, 140, 190, 0.5)";
    context.lineWidth = 1;
    context.strokeRect(viewport.left, viewport.top, viewport.width, viewport.height);
  }

  private DrawGrid(
    context: CanvasRenderingContext2D,
    range: CurveRange,
    viewport: CurveViewport,
  ): void {
    context.strokeStyle = this.GridColor;
    context.lineWidth = 1;
    const divisions = 6;
    for (let i = 1; i < divisions; i += 1) {
      const t = i / divisions;
      const x = viewport.left + viewport.width * t;
      const y = viewport.top + viewport.height * t;
      context.beginPath();
      context.moveTo(x, viewport.top);
      context.lineTo(x, viewport.top + viewport.height);
      context.stroke();

      context.beginPath();
      context.moveTo(viewport.left, y);
      context.lineTo(viewport.left + viewport.width, y);
      context.stroke();
    }

    context.strokeStyle = this.AxisColor;
    context.lineWidth = 1.2;
    if (range.timeMin <= 0 && range.timeMax >= 0) {
      const x = this.MapTimeToX(0, range, viewport);
      context.beginPath();
      context.moveTo(x, viewport.top);
      context.lineTo(x, viewport.top + viewport.height);
      context.stroke();
    }
    if (range.valueMin <= 0 && range.valueMax >= 0) {
      const y = this.MapValueToY(0, range, viewport);
      context.beginPath();
      context.moveTo(viewport.left, y);
      context.lineTo(viewport.left + viewport.width, y);
      context.stroke();
    }
  }

  private DrawCurve(
    context: CanvasRenderingContext2D,
    range: CurveRange,
    viewport: CurveViewport,
  ): void {
    const sampleCount = Math.max(64, Math.floor(viewport.width));
    context.strokeStyle = this.CurveColor;
    context.lineWidth = 2;
    context.beginPath();
    for (let i = 0; i <= sampleCount; i += 1) {
      const normalized = i / sampleCount;
      const time = Mathf.Lerp(range.timeMin, range.timeMax, normalized);
      const value = this.Curve.Evaluate(time);
      const x = this.MapTimeToX(time, range, viewport);
      const y = this.MapValueToY(value, range, viewport);
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }

  private DrawKeys(
    context: CanvasRenderingContext2D,
    range: CurveRange,
    viewport: CurveViewport,
  ): void {
    const keys = this.Curve.Keys;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const x = this.MapTimeToX(key.time, range, viewport);
      const y = this.MapValueToY(key.value, range, viewport);
      context.fillStyle = i === this.draggingKeyIndex ? this.SelectedKeyColor : this.KeyColor;
      context.beginPath();
      context.arc(x, y, 4.8, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(15, 18, 27, 0.95)";
      context.lineWidth = 1;
      context.stroke();
    }
  }

  private UpdateInfo(range: CurveRange): void {
    if (this.infoElement === null) {
      return;
    }

    if (this.draggingKeyIndex !== null) {
      const key = this.Curve.GetKey(this.draggingKeyIndex);
      this.infoElement.textContent =
        `Drag Key ${this.draggingKeyIndex} | time=${key.time.toFixed(3)} value=${key.value.toFixed(3)}`;
      return;
    }

    this.infoElement.textContent =
      `Keys=${this.Curve.length} | time=[${range.timeMin.toFixed(2)}, ${range.timeMax.toFixed(2)}] `
      + `value=[${range.valueMin.toFixed(2)}, ${range.valueMax.toFixed(2)}] `
      + "| double click add key | right click delete key";
  }

  private GetCanvasPoint(event: MouseEvent | PointerEvent): Vector2 | null {
    if (this.canvasElement === null) {
      return null;
    }
    const rect = this.canvasElement.getBoundingClientRect();
    if (rect.width <= Number.EPSILON || rect.height <= Number.EPSILON) {
      return null;
    }
    const x = ((event.clientX - rect.left) / rect.width) * this.canvasElement.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvasElement.height;
    return new Vector2(x, y);
  }

  private FindNearestKeyIndex(
    point: Vector2,
    range: CurveRange,
    viewport: CurveViewport,
    radius: number,
  ): number | null {
    const radiusSquared = radius * radius;
    let nearest: number | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const keys = this.Curve.Keys;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const keyX = this.MapTimeToX(key.time, range, viewport);
      const keyY = this.MapValueToY(key.value, range, viewport);
      const dx = keyX - point.x;
      const dy = keyY - point.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= radiusSquared && distanceSquared < nearestDistance) {
        nearestDistance = distanceSquared;
        nearest = i;
      }
    }
    return nearest;
  }

  private GetEditorRange(): CurveRange {
    if (!this.AutoFrame) {
      let timeMin = Math.min(this.TimeRange.x, this.TimeRange.y);
      let timeMax = Math.max(this.TimeRange.x, this.TimeRange.y);
      let valueMin = Math.min(this.ValueRange.x, this.ValueRange.y);
      let valueMax = Math.max(this.ValueRange.x, this.ValueRange.y);
      if (Math.abs(timeMax - timeMin) <= Number.EPSILON) {
        timeMax = timeMin + 1;
      }
      if (Math.abs(valueMax - valueMin) <= Number.EPSILON) {
        valueMax = valueMin + 1;
      }
      return { timeMin, timeMax, valueMin, valueMax };
    }

    const keys = this.Curve.Keys;
    if (keys.length === 0) {
      return {
        timeMin: 0,
        timeMax: 1,
        valueMin: 0,
        valueMax: 1,
      };
    }

    let timeMin = keys[0].time;
    let timeMax = keys[0].time;
    let valueMin = keys[0].value;
    let valueMax = keys[0].value;
    for (const key of keys) {
      timeMin = Math.min(timeMin, key.time);
      timeMax = Math.max(timeMax, key.time);
      valueMin = Math.min(valueMin, key.value);
      valueMax = Math.max(valueMax, key.value);
    }

    const timePadding = Math.max((timeMax - timeMin) * 0.12, 0.1);
    const valuePadding = Math.max((valueMax - valueMin) * 0.2, 0.1);
    if (Math.abs(timeMax - timeMin) <= Number.EPSILON) {
      timeMin -= 0.5;
      timeMax += 0.5;
    } else {
      timeMin -= timePadding;
      timeMax += timePadding;
    }
    if (Math.abs(valueMax - valueMin) <= Number.EPSILON) {
      valueMin -= 0.5;
      valueMax += 0.5;
    } else {
      valueMin -= valuePadding;
      valueMax += valuePadding;
    }

    return { timeMin, timeMax, valueMin, valueMax };
  }

  private GetViewport(): CurveViewport {
    const canvas = this.canvasElement;
    if (canvas === null) {
      return {
        left: 32,
        top: 14,
        width: 420,
        height: 220,
      };
    }

    const left = 32;
    const top = 14;
    const right = 14;
    const bottom = 26;
    return {
      left,
      top,
      width: Math.max(50, canvas.width - left - right),
      height: Math.max(50, canvas.height - top - bottom),
    };
  }

  private MapTimeToX(time: number, range: CurveRange, viewport: CurveViewport): number {
    const normalized = (time - range.timeMin) / (range.timeMax - range.timeMin);
    return viewport.left + Mathf.Clamp01(normalized) * viewport.width;
  }

  private MapValueToY(value: number, range: CurveRange, viewport: CurveViewport): number {
    const normalized = (value - range.valueMin) / (range.valueMax - range.valueMin);
    return viewport.top + (1 - Mathf.Clamp01(normalized)) * viewport.height;
  }

  private MapXToTime(x: number, range: CurveRange, viewport: CurveViewport): number {
    const normalized = Mathf.Clamp01((x - viewport.left) / viewport.width);
    return Mathf.Lerp(range.timeMin, range.timeMax, normalized);
  }

  private MapYToValue(y: number, range: CurveRange, viewport: CurveViewport): number {
    const normalized = 1 - Mathf.Clamp01((y - viewport.top) / viewport.height);
    return Mathf.Lerp(range.valueMin, range.valueMax, normalized);
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
  Keyframe,
  AnimationCurve,
  Color,
  Vector2,
  Vector3,
  CurveEditor,
};
