import {
  Button,
  Canvas,
  Debug,
  Engine,
  GameObject,
  Image,
  InputField,
  Panel,
  RectTransform,
  ScrollRect,
  Text,
  Vector2,
} from "@h5unity/engine";

type LoginMode = "email" | "phone";
type MachineStatus = "BASE";
type SlotSymbol = "A" | "K" | "Q" | "J" | "7" | "BAR" | "STAR";

type LoginViewRefs = {
  root: GameObject;
  emailModeButton: Button;
  phoneModeButton: Button;
  emailForm: GameObject;
  phoneForm: GameObject;
  emailInput: InputField;
  passwordInput: InputField;
  phoneInput: InputField;
  codeInput: InputField;
  submitButton: Button;
  statusText: Text;
};

type LobbyViewRefs = {
  root: GameObject;
  welcomeText: Text;
};

type MachineEntry = {
  id: number;
  status: MachineStatus;
};

type MachineViewRefs = {
  root: GameObject;
  topRow: GameObject;
  walletRow: GameObject;
  machine4ModeRow: GameObject;
  board: GameObject;
  actionRow: GameObject;
  machineTitleText: Text;
  machineStatusText: Text;
  stateText: Text;
  modeText: Text;
  balanceText: Text;
  betText: Text;
  totalRewardText: Text;
  rewardText: Text;
  spinButton: Button;
  addBetButton: Button;
  subBetButton: Button;
  showRuleButton: Button;
  backButton: Button;
  editModeButton: Button;
  hierarchyToggleButton: Button;
  inspectorToggleButton: Button;
  normalModeButton: Button;
  freeSpinModeButton: Button;
  machine4SpeedToggleButton: Button;
  closeRuleButton: Button;
  ruleBodyText: Text;
  ruleOverlayPanel: Panel;
  ruleDismissButton: Button;
  ruleOverlay: GameObject;
  editorRoot: GameObject;
  editorRootPanel: Panel;
  hierarchyPanelObject: GameObject;
  inspectorPanelObject: GameObject;
  hierarchyPanel: Panel;
  inspectorPanel: Panel;
  hierarchyDragHandleButton: Button;
  inspectorDragHandleButton: Button;
  hierarchyCloseButton: Button;
  inspectorCloseButton: Button;
  hierarchyListPanel: Panel;
  inspectorTitleText: Text;
  inspectorBodyText: Text;
  cellTexts: Text[];
  cellPanels: Panel[];
  boardPanel: Panel;
};

type SpinState = "accelerate" | "constant" | "decelerate" | "callback" | "stop";
type Machine4Mode = "normal" | "freeSpin";

type LineWin = {
  lineIndex: number;
  amount: number;
  symbol: SlotSymbol;
};

type ReelAxis = {
  strip: SlotSymbol[];
  position: number;
};

type MachineGridConfig = {
  rows: number;
  columns: number;
  paylines: readonly (readonly number[])[];
  paylineNames: readonly string[];
};

type IconRollDirection = "up" | "down";

const SLOT_SYMBOLS: readonly SlotSymbol[] = ["A", "K", "Q", "J", "7", "BAR", "STAR"];

const PAYOUT_MULTIPLIER: Record<SlotSymbol, number> = {
  A: 2,
  K: 3,
  Q: 4,
  J: 5,
  "7": 8,
  BAR: 10,
  STAR: 12,
};

const MACHINE_ROWS = 3;
const MACHINE_MAX_COLUMNS = 4;
const MACHINE3_REEL_COUNT = 3;
const MACHINE4_REEL_COUNT = 4;

const GRID_CONFIG_3X3: MachineGridConfig = {
  rows: MACHINE_ROWS,
  columns: MACHINE3_REEL_COUNT,
  paylines: [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 4, 8],
    [2, 4, 6],
  ],
  paylineNames: ["Top", "Middle", "Bottom", "Diagonal LR", "Diagonal RL"],
};

const GRID_CONFIG_3X4: MachineGridConfig = {
  rows: MACHINE_ROWS,
  columns: MACHINE4_REEL_COUNT,
  paylines: [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
  ],
  paylineNames: ["Top", "Middle", "Bottom"],
};

const REEL_STRIP_LENGTH = 24;

const SPIN_STATE_LABEL: Record<SpinState, string> = {
  accelerate: "State: Accelerate",
  constant: "State: Constant Speed",
  decelerate: "State: Decelerate",
  callback: "State: Callback Effect",
  stop: "State: Stop",
};

const MACHINE4_MODE_LABEL: Record<Machine4Mode, string> = {
  normal: "Normal",
  freeSpin: "FreeSpin",
};
const MACHINE4_FREE_SPIN_TRIGGER_CHANCE = 0.1;
const MACHINE4_FREE_SPIN_MIN_COUNT = 3;
const MACHINE4_FREE_SPIN_MAX_COUNT = 8;
const MACHINE4_SEQUENTIAL_START_GAP_MS = 110;

const BuildRuleText = (gridConfig: MachineGridConfig): string => {
  const lines = [
    "Rules:",
    "1) Spin costs current bet.",
    `2) Slot board is ${gridConfig.rows}x${gridConfig.columns}.`,
    "3) Paylines:",
  ];
  for (let lineIndex = 0; lineIndex < gridConfig.paylines.length; lineIndex += 1) {
    const paylineName = gridConfig.paylineNames[lineIndex] ?? `Line ${lineIndex + 1}`;
    lines.push(`   - ${paylineName} (${gridConfig.paylines[lineIndex].join(",")})`);
  }
  lines.push("4) All symbols in one payline must be the same to win.");
  lines.push("5) Reward = bet x symbol multiplier.");
  lines.push("6) Multipliers: A2 K3 Q4 J5 7x8 BAR10 STAR12.");
  return lines.join("\n");
};

const BuildMachineRuleText = (
  machineId: number,
  gridConfig: MachineGridConfig,
  machine4Mode: Machine4Mode,
  machine4FreeSpinsRemaining: number,
  machine4Accelerated: boolean,
): string => {
  const baseRule = BuildRuleText(gridConfig);
  if (machineId !== 4) {
    return baseRule;
  }

  const modeLine =
    machine4Mode === "freeSpin"
      ? `Current Mode: ${MACHINE4_MODE_LABEL[machine4Mode]} (Left ${machine4FreeSpinsRemaining})`
      : `Current Mode: ${MACHINE4_MODE_LABEL[machine4Mode]}`;
  const speedLine = machine4Accelerated ? "Speed: Accelerate (all reels start together)." : "Speed: Normal (reels start left -> right).";

  return [
    baseRule,
    "",
    "Machine 4 Modes:",
    modeLine,
    speedLine,
    "- Normal: Spin consumes current bet.",
    "- Normal has 10% chance to trigger 3~8 FreeSpins.",
    "- FreeSpin: Spin does not consume bet and consumes 1 FreeSpin each spin.",
  ].join("\n");
};

let machine2RollStyleInjected = false;

function CreateChild(parent: GameObject, name: string): GameObject {
  const child = new GameObject(name);
  child.transform.SetParent(parent.transform);
  return child;
}

function SetRect(
  gameObject: GameObject,
  x: number,
  y: number,
  width: number,
  height: number,
  pivotX = 0.5,
  pivotY = 0.5,
): RectTransform {
  const rectTransform = gameObject.AddComponent(RectTransform);
  rectTransform.anchoredPosition = new Vector2(x, y);
  rectTransform.sizeDelta = new Vector2(width, height);
  rectTransform.pivot = new Vector2(pivotX, pivotY);
  return rectTransform;
}

function CreateLabel(parent: GameObject, name: string, value: string, fontSize = 16): Text {
  const labelNode = CreateChild(parent, name);
  const label = labelNode.AddComponent(Text);
  label.LayoutMode = "flow";
  label.Value = value;
  label.FontSize = fontSize;
  return label;
}

function RandomSymbol(): SlotSymbol {
  const index = Math.floor(Math.random() * SLOT_SYMBOLS.length);
  return SLOT_SYMBOLS[index];
}

function SpinSymbols(cellCount: number): SlotSymbol[] {
  return Array.from({ length: cellCount }, () => RandomSymbol());
}

function EvaluatePaylines(
  symbols: readonly SlotSymbol[],
  bet: number,
  gridConfig: MachineGridConfig,
): { totalWin: number; lineWins: LineWin[] } {
  let totalWin = 0;
  const lineWins: LineWin[] = [];
  for (let lineIndex = 0; lineIndex < gridConfig.paylines.length; lineIndex += 1) {
    const payline = gridConfig.paylines[lineIndex];
    const firstSymbol = symbols[payline[0]];
    if (firstSymbol === undefined) {
      continue;
    }

    let allMatched = true;
    for (let symbolIndex = 1; symbolIndex < payline.length; symbolIndex += 1) {
      if (symbols[payline[symbolIndex]] !== firstSymbol) {
        allMatched = false;
        break;
      }
    }

    if (allMatched) {
      const amount = bet * PAYOUT_MULTIPLIER[firstSymbol];
      totalWin += amount;
      lineWins.push({
        lineIndex,
        amount,
        symbol: firstSymbol,
      });
    }
  }
  return { totalWin, lineWins };
}

function Sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function CreateRandomReelAxis(stripLength = REEL_STRIP_LENGTH): ReelAxis {
  return {
    strip: Array.from({ length: stripLength }, () => RandomSymbol()),
    position: Math.floor(Math.random() * stripLength),
  };
}

function CreateReelAxes(columnCount: number): ReelAxis[] {
  return Array.from({ length: columnCount }, () => CreateRandomReelAxis());
}

function GetGridFromReelAxes(reelAxes: readonly ReelAxis[], rowCount: number): SlotSymbol[] {
  const grid: SlotSymbol[] = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < reelAxes.length; column += 1) {
      const axis = reelAxes[column];
      const stripLength = axis.strip.length;
      const symbolIndex = (axis.position + row) % stripLength;
      grid.push(axis.strip[symbolIndex]);
    }
  }
  return grid;
}

function StepReelAxesDown(reelAxes: readonly ReelAxis[]): void {
  for (const axis of reelAxes) {
    axis.position = (axis.position + 1) % axis.strip.length;
  }
}

function StepReelAxesDownByColumns(reelAxes: readonly ReelAxis[], columns: readonly number[]): void {
  for (const column of columns) {
    const axis = reelAxes[column];
    if (axis === undefined) {
      continue;
    }
    axis.position = (axis.position + 1) % axis.strip.length;
  }
}

function FindPatternStart(strip: readonly SlotSymbol[], pattern: readonly SlotSymbol[]): number | null {
  for (let start = 0; start < strip.length; start += 1) {
    let matched = true;
    for (let index = 0; index < pattern.length; index += 1) {
      const stripIndex = (start + index) % strip.length;
      if (strip[stripIndex] !== pattern[index]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return start;
    }
  }
  return null;
}

function AlignReelAxesToTargetGrid(
  reelAxes: readonly ReelAxis[],
  targetGrid: readonly SlotSymbol[],
  rowCount: number,
  columnCount: number,
): void {
  for (let column = 0; column < columnCount; column += 1) {
    const axis = reelAxes[column];
    const expected: SlotSymbol[] = [];
    for (let row = 0; row < rowCount; row += 1) {
      expected.push(targetGrid[row * columnCount + column]);
    }
    const found = FindPatternStart(axis.strip, expected);
    if (found !== null) {
      axis.position = found;
      continue;
    }

    for (let row = 0; row < expected.length; row += 1) {
      const stripIndex = (axis.position + row) % axis.strip.length;
      axis.strip[stripIndex] = expected[row];
    }
  }
}

async function RunStateRollingPhaseForReelAxes(
  reelAxes: readonly ReelAxis[],
  rowCount: number,
  durationMs: number,
  getStepMs: (progress01: number) => number,
  shouldContinue: () => boolean,
  onStep: (grid: SlotSymbol[]) => void,
  onStepVisual?: () => void,
): Promise<void> {
  const start = Date.now();
  while (true) {
    if (!shouldContinue()) {
      return;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= durationMs) {
      break;
    }
    const progress = Math.min(elapsed / durationMs, 1);
    const stepMs = Math.max(18, Math.round(getStepMs(progress)));
    await Sleep(stepMs);
    if (!shouldContinue()) {
      return;
    }
    StepReelAxesDown(reelAxes);
    onStep(GetGridFromReelAxes(reelAxes, rowCount));
    onStepVisual?.();
  }
}

async function PlayMachine3CallbackEffect(machineView: MachineViewRefs): Promise<void> {
  const pulses: Array<{ border: string; width: number }> = [
    { border: "#ffd76a", width: 2 },
    { border: "#4a5e91", width: 1 },
    { border: "#ffd76a", width: 2 },
    { border: "#4a5e91", width: 1 },
  ];

  for (const pulse of pulses) {
    machineView.boardPanel.BorderColor = pulse.border;
    machineView.boardPanel.BorderWidth = pulse.width;
    await Sleep(90);
  }
}

function EnsureMachine2RollStyles(documentRef: Document): void {
  if (machine2RollStyleInjected) {
    return;
  }

  const style = documentRef.createElement("style");
  style.textContent = `
    @keyframes machine2IconRollUp {
      from { background-position: center 0px; }
      to { background-position: center -120px; }
    }
    @keyframes machine2IconRollDown {
      from { background-position: center 0px; }
      to { background-position: center 120px; }
    }
  `;
  documentRef.head.appendChild(style);
  machine2RollStyleInjected = true;
}

function SetMachineIconRoll(icon: Image, direction: IconRollDirection): void {
  const element = icon.Element;
  element.style.backgroundSize = "100% 36px";
  element.style.backgroundRepeat = "repeat-y";
  element.style.animation =
    direction === "up"
      ? "machine2IconRollUp 0.55s linear infinite"
      : "machine2IconRollDown 0.55s linear infinite";
}

function BuildLoginPage(root: GameObject, canvas: HTMLCanvasElement): LoginViewRefs {
  const pageRoot = CreateChild(root, "LoginPage");
  const pagePanel = pageRoot.AddComponent(Panel);
  pagePanel.LayoutMode = "absolute";
  pagePanel.Direction = "column";
  pagePanel.AlignItems = "center";
  pagePanel.JustifyContent = "center";
  pagePanel.BackgroundColor = "rgba(8, 10, 18, 0.66)";
  SetRect(pageRoot, 0, 0, canvas.width, canvas.height, 0, 0);

  const cardNode = CreateChild(pageRoot, "LoginCard");
  const cardPanel = cardNode.AddComponent(Panel);
  cardPanel.LayoutMode = "flow";
  cardPanel.Direction = "column";
  cardPanel.Gap = 14;
  cardPanel.Padding = 24;
  cardPanel.BackgroundColor = "rgba(20, 25, 40, 0.96)";
  cardPanel.BorderColor = "#42507a";
  cardPanel.BorderWidth = 1;
  cardPanel.BorderRadius = 14;
  cardPanel.AlignItems = "stretch";
  SetRect(cardNode, 0, 0, 460, 420);

  const title = CreateLabel(cardNode, "LoginTitle", "H5 Slot Login", 28);
  title.FontWeight = "700";
  title.TextAlign = "center";

  const subtitle = CreateLabel(cardNode, "LoginSubtitle", "Choose email login or phone login.", 14);
  subtitle.Color = "#9ba8d5";
  subtitle.TextAlign = "center";

  const modeRowNode = CreateChild(cardNode, "ModeRow");
  const modeRowPanel = modeRowNode.AddComponent(Panel);
  modeRowPanel.LayoutMode = "flow";
  modeRowPanel.Direction = "row";
  modeRowPanel.Gap = 10;
  modeRowPanel.AlignItems = "center";
  modeRowPanel.JustifyContent = "center";

  const emailButtonNode = CreateChild(modeRowNode, "EmailModeButton");
  const emailModeButton = emailButtonNode.AddComponent(Button);
  emailModeButton.LayoutMode = "flow";
  emailModeButton.Label = "Email Login";
  emailModeButton.BorderRadius = 999;
  emailModeButton.Padding = "8px 16px";

  const phoneButtonNode = CreateChild(modeRowNode, "PhoneModeButton");
  const phoneModeButton = phoneButtonNode.AddComponent(Button);
  phoneModeButton.LayoutMode = "flow";
  phoneModeButton.Label = "Phone Login";
  phoneModeButton.BorderRadius = 999;
  phoneModeButton.Padding = "8px 16px";

  const emailForm = CreateChild(cardNode, "EmailForm");
  const emailFormPanel = emailForm.AddComponent(Panel);
  emailFormPanel.LayoutMode = "flow";
  emailFormPanel.Direction = "column";
  emailFormPanel.Gap = 10;

  const emailInputNode = CreateChild(emailForm, "EmailInput");
  const emailInput = emailInputNode.AddComponent(InputField);
  emailInput.LayoutMode = "flow";
  emailInput.InputType = "email";
  emailInput.Placeholder = "Email address";

  const passwordInputNode = CreateChild(emailForm, "PasswordInput");
  const passwordInput = passwordInputNode.AddComponent(InputField);
  passwordInput.LayoutMode = "flow";
  passwordInput.InputType = "password";
  passwordInput.Placeholder = "Password";

  const phoneForm = CreateChild(cardNode, "PhoneForm");
  const phoneFormPanel = phoneForm.AddComponent(Panel);
  phoneFormPanel.LayoutMode = "flow";
  phoneFormPanel.Direction = "column";
  phoneFormPanel.Gap = 10;

  const phoneInputNode = CreateChild(phoneForm, "PhoneInput");
  const phoneInput = phoneInputNode.AddComponent(InputField);
  phoneInput.LayoutMode = "flow";
  phoneInput.InputType = "tel";
  phoneInput.Placeholder = "Phone number";

  const codeInputNode = CreateChild(phoneForm, "CodeInput");
  const codeInput = codeInputNode.AddComponent(InputField);
  codeInput.LayoutMode = "flow";
  codeInput.InputType = "text";
  codeInput.Placeholder = "Verification code";

  const submitButtonNode = CreateChild(cardNode, "SubmitButton");
  const submitButton = submitButtonNode.AddComponent(Button);
  submitButton.LayoutMode = "flow";
  submitButton.Label = "Login";
  submitButton.FontSize = 18;
  submitButton.Padding = "12px 20px";
  submitButton.BackgroundColor = "#3f8cff";
  submitButton.BorderColor = "#3f8cff";
  submitButton.BorderRadius = 10;

  const statusText = CreateLabel(cardNode, "StatusText", "Ready to login.", 14);
  statusText.Color = "#9ba8d5";
  statusText.TextAlign = "center";

  return {
    root: pageRoot,
    emailModeButton,
    phoneModeButton,
    emailForm,
    phoneForm,
    emailInput,
    passwordInput,
    phoneInput,
    codeInput,
    submitButton,
    statusText,
  };
}

function BuildLobbyPage(
  root: GameObject,
  canvas: HTMLCanvasElement,
  machineEntries: readonly MachineEntry[],
  onEnterMachine: (machine: MachineEntry) => void,
): LobbyViewRefs {
  EnsureMachine2RollStyles(canvas.ownerDocument);

  const pageRoot = CreateChild(root, "LobbyPage");
  const pagePanel = pageRoot.AddComponent(Panel);
  pagePanel.LayoutMode = "absolute";
  pagePanel.Direction = "column";
  pagePanel.Gap = 14;
  pagePanel.Padding = 24;
  pagePanel.BackgroundColor = "linear-gradient(180deg, #141b31 0%, #0f1425 100%)";
  SetRect(pageRoot, 0, 0, canvas.width, canvas.height, 0, 0);

  const title = CreateLabel(pageRoot, "LobbyTitle", "Slot Lobby", 30);
  title.FontWeight = "700";

  const welcomeText = CreateLabel(pageRoot, "WelcomeText", "Welcome!", 16);
  welcomeText.Color = "#c5cfff";

  const tips = CreateLabel(pageRoot, "LobbyTips", "Swipe horizontally and select one machine entry.", 14);
  tips.Color = "#95a6df";

  const scrollNode = CreateChild(pageRoot, "MachineScroll");
  const scrollRect = scrollNode.AddComponent(ScrollRect);
  scrollRect.LayoutMode = "flow";
  scrollRect.Horizontal = true;
  scrollRect.Vertical = false;
  scrollRect.ContentGap = 16;
  scrollRect.Padding = 14;
  scrollRect.BackgroundColor = "rgba(8, 11, 22, 0.35)";
  SetRect(scrollNode, 0, 0, canvas.width - 48, 280);

  for (const machine of machineEntries) {
    const machineNode = CreateChild(scrollNode, `Machine-${machine.id}`);
    const machinePanel = machineNode.AddComponent(Panel);
    machinePanel.LayoutMode = "flow";
    machinePanel.Direction = "column";
    machinePanel.AlignItems = "center";
    machinePanel.JustifyContent = "space-between";
    machinePanel.Gap = 8;
    machinePanel.Padding = 12;
    machinePanel.BackgroundColor = "#1e2742";
    machinePanel.BorderColor = "#4d5e90";
    machinePanel.BorderWidth = 1;
    machinePanel.BorderRadius = 12;
    SetRect(machineNode, 0, 0, 180, 230);

    const iconNode = CreateChild(machineNode, "EntryIcon");
    const icon = iconNode.AddComponent(Image);
    icon.LayoutMode = "flow";
    icon.BackgroundColor = "linear-gradient(135deg, #3b5cff 0%, #6a82ff 100%)";
    icon.BorderColor = "#9db1ff";
    icon.BorderWidth = 1;
    icon.BorderRadius = 10;
    SetRect(iconNode, 0, 0, 132, 92);

    if (machine.id === 2) {
      icon.BackgroundColor =
        "repeating-linear-gradient(180deg, #86a0ff 0px, #86a0ff 14px, #4e6be1 14px, #4e6be1 28px)";

      const rollControlNode = CreateChild(machineNode, "RollControlRow");
      const rollControlPanel = rollControlNode.AddComponent(Panel);
      rollControlPanel.LayoutMode = "flow";
      rollControlPanel.Direction = "row";
      rollControlPanel.Gap = 6;
      rollControlPanel.AlignItems = "center";
      SetRect(rollControlNode, 0, 0, 154, 34);

      const rollButtonNode = CreateChild(rollControlNode, "RollButton");
      const rollButton = rollButtonNode.AddComponent(Button);
      rollButton.LayoutMode = "flow";
      rollButton.Label = "Roll";
      rollButton.FontSize = 12;
      rollButton.Padding = "6px 10px";
      rollButton.BackgroundColor = "#4a64d3";
      rollButton.BorderColor = "#89a2ff";
      rollButton.BorderRadius = 8;
      rollButton.OnClick.AddListener(() => {
        SetMachineIconRoll(icon, "up");
      });

      const downRollButtonNode = CreateChild(rollControlNode, "DownRollButton");
      const downRollButton = downRollButtonNode.AddComponent(Button);
      downRollButton.LayoutMode = "flow";
      downRollButton.Label = "Down Roll";
      downRollButton.FontSize = 12;
      downRollButton.Padding = "6px 10px";
      downRollButton.BackgroundColor = "#4a64d3";
      downRollButton.BorderColor = "#89a2ff";
      downRollButton.BorderRadius = 8;
      downRollButton.OnClick.AddListener(() => {
        SetMachineIconRoll(icon, "down");
      });
    }

    const machineTitle = CreateLabel(
      machineNode,
      "MachineTitle",
      `Machine ${machine.id.toString().padStart(2, "0")}`,
      18,
    );
    machineTitle.FontWeight = "600";
    machineTitle.TextAlign = "center";

    const machineStatus = CreateLabel(machineNode, "MachineStatus", `Status: ${machine.status}`, 14);
    machineStatus.Color = "#95d79f";
    machineStatus.TextAlign = "center";

    const entryButtonNode = CreateChild(machineNode, "EntryButton");
    const entryButton = entryButtonNode.AddComponent(Button);
    entryButton.LayoutMode = "flow";
    entryButton.Label = "Enter";
    entryButton.FontSize = 14;
    entryButton.Padding = "8px 14px";
    entryButton.BackgroundColor = "#4f7bff";
    entryButton.BorderColor = "#4f7bff";
    entryButton.BorderRadius = 8;
    entryButton.OnClick.AddListener(() => {
      onEnterMachine(machine);
    });
  }

  return {
    root: pageRoot,
    welcomeText,
  };
}

function BuildMachinePage(root: GameObject, canvas: HTMLCanvasElement): MachineViewRefs {
  const pageRoot = CreateChild(root, "MachinePage");
  const pagePanel = pageRoot.AddComponent(Panel);
  pagePanel.LayoutMode = "absolute";
  pagePanel.Direction = "column";
  pagePanel.Gap = 14;
  pagePanel.Padding = 24;
  pagePanel.BackgroundColor = "linear-gradient(180deg, #10192f 0%, #0b1223 100%)";
  SetRect(pageRoot, 0, 0, canvas.width, canvas.height, 0, 0);

  const topRowNode = CreateChild(pageRoot, "TopRow");
  const topRowPanel = topRowNode.AddComponent(Panel);
  topRowPanel.LayoutMode = "flow";
  topRowPanel.Direction = "row";
  topRowPanel.AlignItems = "center";
  topRowPanel.JustifyContent = "space-between";
  SetRect(topRowNode, 0, 0, canvas.width - 48, 68);

  const leftControlNode = CreateChild(topRowNode, "LeftControlRow");
  const leftControlPanel = leftControlNode.AddComponent(Panel);
  leftControlPanel.LayoutMode = "flow";
  leftControlPanel.Direction = "row";
  leftControlPanel.Gap = 8;
  leftControlPanel.AlignItems = "center";

  const backButtonNode = CreateChild(leftControlNode, "BackButton");
  const backButton = backButtonNode.AddComponent(Button);
  backButton.LayoutMode = "flow";
  backButton.Label = "Back To Lobby";
  backButton.Padding = "10px 14px";
  backButton.BackgroundColor = "#3e4c78";
  backButton.BorderColor = "#5e73b0";
  backButton.BorderRadius = 8;

  const editModeButtonNode = CreateChild(leftControlNode, "EditModeButton");
  const editModeButton = editModeButtonNode.AddComponent(Button);
  editModeButton.LayoutMode = "flow";
  editModeButton.Label = "Edit Mode";
  editModeButton.Padding = "10px 14px";
  editModeButton.BackgroundColor = "#444f7f";
  editModeButton.BorderColor = "#7385c6";
  editModeButton.BorderRadius = 8;

  const hierarchyToggleButtonNode = CreateChild(leftControlNode, "HierarchyToggleButton");
  const hierarchyToggleButton = hierarchyToggleButtonNode.AddComponent(Button);
  hierarchyToggleButton.LayoutMode = "flow";
  hierarchyToggleButton.Label = "Hierarchy";
  hierarchyToggleButton.Padding = "10px 12px";
  hierarchyToggleButton.BackgroundColor = "#445283";
  hierarchyToggleButton.BorderColor = "#748ccf";
  hierarchyToggleButton.BorderRadius = 8;

  const inspectorToggleButtonNode = CreateChild(leftControlNode, "InspectorToggleButton");
  const inspectorToggleButton = inspectorToggleButtonNode.AddComponent(Button);
  inspectorToggleButton.LayoutMode = "flow";
  inspectorToggleButton.Label = "Inspector";
  inspectorToggleButton.Padding = "10px 12px";
  inspectorToggleButton.BackgroundColor = "#445283";
  inspectorToggleButton.BorderColor = "#748ccf";
  inspectorToggleButton.BorderRadius = 8;

  const titleGroupNode = CreateChild(topRowNode, "TitleGroup");
  const titleGroupPanel = titleGroupNode.AddComponent(Panel);
  titleGroupPanel.LayoutMode = "flow";
  titleGroupPanel.Direction = "column";
  titleGroupPanel.AlignItems = "flex-end";
  titleGroupPanel.Gap = 2;

  const machineTitleText = CreateLabel(titleGroupNode, "MachineTitle", "Machine --", 26);
  machineTitleText.FontWeight = "700";
  machineTitleText.TextAlign = "right";

  const machineStatusText = CreateLabel(titleGroupNode, "MachineStatus", "Status: BASE", 14);
  machineStatusText.Color = "#95d79f";
  machineStatusText.TextAlign = "right";

  const stateText = CreateLabel(titleGroupNode, "StateText", SPIN_STATE_LABEL.stop, 13);
  stateText.Color = "#95a6df";
  stateText.TextAlign = "right";

  const modeText = CreateLabel(titleGroupNode, "ModeText", "Mode: --", 13);
  modeText.Color = "#95a6df";
  modeText.TextAlign = "right";

  const walletRowNode = CreateChild(pageRoot, "WalletRow");
  const walletRowPanel = walletRowNode.AddComponent(Panel);
  walletRowPanel.LayoutMode = "flow";
  walletRowPanel.Direction = "row";
  walletRowPanel.Gap = 12;
  walletRowPanel.AlignItems = "center";
  walletRowPanel.JustifyContent = "space-between";
  walletRowPanel.BackgroundColor = "rgba(21, 30, 56, 0.62)";
  walletRowPanel.BorderColor = "#39496f";
  walletRowPanel.BorderWidth = 1;
  walletRowPanel.BorderRadius = 10;
  walletRowPanel.Padding = 12;
  SetRect(walletRowNode, 0, 0, canvas.width - 48, 86);

  const balanceText = CreateLabel(walletRowNode, "BalanceText", "Balance: 0", 18);
  balanceText.FontWeight = "600";

  const betText = CreateLabel(walletRowNode, "BetText", "Bet: 0", 18);
  betText.FontWeight = "600";

  const totalRewardText = CreateLabel(walletRowNode, "TotalRewardText", "Total Reward: 0", 18);
  totalRewardText.FontWeight = "600";
  totalRewardText.TextAlign = "right";

  const machine4ModeRowNode = CreateChild(pageRoot, "Machine4ModeRow");
  const machine4ModeRowPanel = machine4ModeRowNode.AddComponent(Panel);
  machine4ModeRowPanel.LayoutMode = "flow";
  machine4ModeRowPanel.Direction = "row";
  machine4ModeRowPanel.Gap = 10;
  machine4ModeRowPanel.AlignItems = "center";
  machine4ModeRowPanel.JustifyContent = "center";
  machine4ModeRowPanel.Padding = 10;
  machine4ModeRowPanel.BackgroundColor = "rgba(21, 30, 56, 0.45)";
  machine4ModeRowPanel.BorderColor = "#39496f";
  machine4ModeRowPanel.BorderWidth = 1;
  machine4ModeRowPanel.BorderRadius = 10;
  SetRect(machine4ModeRowNode, 0, 0, canvas.width - 48, 64);

  const machine4ModeLabel = CreateLabel(machine4ModeRowNode, "Machine4ModeLabel", "Machine 4 Mode:", 16);
  machine4ModeLabel.FontWeight = "600";

  const normalModeButtonNode = CreateChild(machine4ModeRowNode, "NormalModeButton");
  const normalModeButton = normalModeButtonNode.AddComponent(Button);
  normalModeButton.LayoutMode = "flow";
  normalModeButton.Label = "Normal Spin";
  normalModeButton.Padding = "8px 12px";
  normalModeButton.BackgroundColor = "#445283";
  normalModeButton.BorderColor = "#748ccf";
  normalModeButton.BorderRadius = 8;

  const freeSpinModeButtonNode = CreateChild(machine4ModeRowNode, "FreeSpinModeButton");
  const freeSpinModeButton = freeSpinModeButtonNode.AddComponent(Button);
  freeSpinModeButton.LayoutMode = "flow";
  freeSpinModeButton.Label = "FreeSpin";
  freeSpinModeButton.Padding = "8px 12px";
  freeSpinModeButton.BackgroundColor = "#445283";
  freeSpinModeButton.BorderColor = "#748ccf";
  freeSpinModeButton.BorderRadius = 8;

  const speedToggleButtonNode = CreateChild(machine4ModeRowNode, "Machine4SpeedToggleButton");
  const machine4SpeedToggleButton = speedToggleButtonNode.AddComponent(Button);
  machine4SpeedToggleButton.LayoutMode = "flow";
  machine4SpeedToggleButton.Label = "Speed: Normal";
  machine4SpeedToggleButton.Padding = "8px 12px";
  machine4SpeedToggleButton.BackgroundColor = "#445283";
  machine4SpeedToggleButton.BorderColor = "#748ccf";
  machine4SpeedToggleButton.BorderRadius = 8;

  machine4ModeRowNode.SetActive(false);

  const boardNode = CreateChild(pageRoot, "SlotBoard");
  const boardPanel = boardNode.AddComponent(Panel);
  boardPanel.LayoutMode = "flow";
  boardPanel.Direction = "column";
  boardPanel.AlignItems = "center";
  boardPanel.Gap = 10;
  boardPanel.Padding = 12;
  boardPanel.BackgroundColor = "rgba(8, 12, 24, 0.72)";
  boardPanel.BorderColor = "#475377";
  boardPanel.BorderWidth = 1;
  boardPanel.BorderRadius = 12;
  SetRect(boardNode, 0, 0, 520, 330);

  const cellTexts: Text[] = [];
  const cellPanels: Panel[] = [];
  for (let row = 0; row < MACHINE_ROWS; row += 1) {
    const rowNode = CreateChild(boardNode, `Row-${row}`);
    const rowPanel = rowNode.AddComponent(Panel);
    rowPanel.LayoutMode = "flow";
    rowPanel.Direction = "row";
    rowPanel.Gap = 10;
    rowPanel.AlignItems = "center";
    rowPanel.JustifyContent = "center";

    for (let column = 0; column < MACHINE_MAX_COLUMNS; column += 1) {
      const index = row * MACHINE_MAX_COLUMNS + column;
      const cellNode = CreateChild(rowNode, `Cell-${index}`);
      const cellPanel = cellNode.AddComponent(Panel);
      cellPanel.LayoutMode = "flow";
      cellPanel.Direction = "column";
      cellPanel.AlignItems = "center";
      cellPanel.JustifyContent = "center";
      cellPanel.BackgroundColor = "#1e2a4c";
      cellPanel.BorderColor = "#4a5e91";
      cellPanel.BorderWidth = 1;
      cellPanel.BorderRadius = 8;
      SetRect(cellNode, 0, 0, 110, 84);
      cellPanels.push(cellPanel);

      const symbolText = CreateLabel(cellNode, "Symbol", "-", 28);
      symbolText.FontWeight = "700";
      symbolText.TextAlign = "center";
      cellTexts.push(symbolText);
    }
  }

  const actionRowNode = CreateChild(pageRoot, "ActionRow");
  const actionRowPanel = actionRowNode.AddComponent(Panel);
  actionRowPanel.LayoutMode = "flow";
  actionRowPanel.Direction = "row";
  actionRowPanel.AlignItems = "center";
  actionRowPanel.JustifyContent = "center";
  actionRowPanel.Gap = 10;
  SetRect(actionRowNode, 0, 0, canvas.width - 48, 64);

  const subBetNode = CreateChild(actionRowNode, "SubBetButton");
  const subBetButton = subBetNode.AddComponent(Button);
  subBetButton.LayoutMode = "flow";
  subBetButton.Label = "- Bet";
  subBetButton.Padding = "10px 12px";
  subBetButton.BackgroundColor = "#3e4c78";
  subBetButton.BorderColor = "#5e73b0";
  subBetButton.BorderRadius = 8;

  const addBetNode = CreateChild(actionRowNode, "AddBetButton");
  const addBetButton = addBetNode.AddComponent(Button);
  addBetButton.LayoutMode = "flow";
  addBetButton.Label = "+ Bet";
  addBetButton.Padding = "10px 12px";
  addBetButton.BackgroundColor = "#3e4c78";
  addBetButton.BorderColor = "#5e73b0";
  addBetButton.BorderRadius = 8;

  const spinNode = CreateChild(actionRowNode, "SpinButton");
  const spinButton = spinNode.AddComponent(Button);
  spinButton.LayoutMode = "flow";
  spinButton.Label = "SPIN";
  spinButton.FontSize = 20;
  spinButton.Padding = "10px 20px";
  spinButton.BackgroundColor = "#2f8d48";
  spinButton.BorderColor = "#37aa56";
  spinButton.BorderRadius = 9;

  const showRuleNode = CreateChild(actionRowNode, "ShowRuleButton");
  const showRuleButton = showRuleNode.AddComponent(Button);
  showRuleButton.LayoutMode = "flow";
  showRuleButton.Label = "Show Rule";
  showRuleButton.Padding = "10px 12px";
  showRuleButton.BackgroundColor = "#4f5d8f";
  showRuleButton.BorderColor = "#7a8fd5";
  showRuleButton.BorderRadius = 8;

  const rewardText = CreateLabel(pageRoot, "RewardText", "Press SPIN to play.", 16);
  rewardText.Color = "#95a6df";
  rewardText.TextAlign = "center";

  const ruleOverlay = CreateChild(pageRoot, "RuleOverlay");
  const overlayPanel = ruleOverlay.AddComponent(Panel);
  overlayPanel.LayoutMode = "absolute";
  overlayPanel.Direction = "column";
  overlayPanel.AlignItems = "center";
  overlayPanel.JustifyContent = "center";
  overlayPanel.BackgroundColor = "rgba(4, 6, 12, 0.8)";
  overlayPanel.Visible = false;
  overlayPanel.Interactable = false;
  SetRect(ruleOverlay, 0, 0, canvas.width, canvas.height, 0, 0);

  const ruleDismissNode = CreateChild(ruleOverlay, "RuleDismissButton");
  const ruleDismissButton = ruleDismissNode.AddComponent(Button);
  ruleDismissButton.LayoutMode = "absolute";
  ruleDismissButton.Label = "";
  ruleDismissButton.Padding = "0";
  ruleDismissButton.BackgroundColor = "rgba(0,0,0,0)";
  ruleDismissButton.BorderColor = "rgba(0,0,0,0)";
  ruleDismissButton.BorderWidth = 0;
  ruleDismissButton.BorderRadius = 0;
  SetRect(ruleDismissNode, 0, 0, canvas.width, canvas.height, 0, 0);

  const ruleCardNode = CreateChild(ruleOverlay, "RuleCard");
  const ruleCardPanel = ruleCardNode.AddComponent(Panel);
  ruleCardPanel.LayoutMode = "flow";
  ruleCardPanel.Direction = "column";
  ruleCardPanel.Gap = 12;
  ruleCardPanel.Padding = 18;
  ruleCardPanel.BackgroundColor = "#1b2541";
  ruleCardPanel.BorderColor = "#5a6b9d";
  ruleCardPanel.BorderWidth = 1;
  ruleCardPanel.BorderRadius = 10;
  SetRect(ruleCardNode, canvas.width / 2, canvas.height / 2, 640, 380);

  const ruleTitle = CreateLabel(ruleCardNode, "RuleTitle", "Slot Rule", 24);
  ruleTitle.FontWeight = "700";
  ruleTitle.TextAlign = "center";

  const ruleBodyText = CreateLabel(ruleCardNode, "RuleBody", BuildRuleText(GRID_CONFIG_3X3), 14);
  ruleBodyText.Color = "#cad6ff";
  ruleBodyText.TextAlign = "left";

  const closeRuleNode = CreateChild(ruleCardNode, "CloseRuleButton");
  const closeRuleButton = closeRuleNode.AddComponent(Button);
  closeRuleButton.LayoutMode = "flow";
  closeRuleButton.Label = "Close";
  closeRuleButton.Padding = "10px 14px";
  closeRuleButton.BackgroundColor = "#4f5d8f";
  closeRuleButton.BorderColor = "#7a8fd5";
  closeRuleButton.BorderRadius = 8;

  ruleDismissButton.Element.style.zIndex = "1";
  ruleCardPanel.Element.style.zIndex = "2";
  ruleCardPanel.Element.style.position = "relative";

  const editorRoot = CreateChild(pageRoot, "EditorModeRoot");
  const editorRootPanel = editorRoot.AddComponent(Panel);
  editorRootPanel.LayoutMode = "absolute";
  editorRootPanel.Direction = "column";
  editorRootPanel.BackgroundColor = "transparent";
  editorRootPanel.Visible = false;
  SetRect(editorRoot, 0, 0, canvas.width, canvas.height, 0, 0);

  const hierarchyPanelNode = CreateChild(editorRoot, "HierarchyPanel");
  const hierarchyPanel = hierarchyPanelNode.AddComponent(Panel);
  hierarchyPanel.LayoutMode = "absolute";
  hierarchyPanel.Direction = "column";
  hierarchyPanel.Gap = 8;
  hierarchyPanel.Padding = 12;
  hierarchyPanel.BackgroundColor = "rgba(15, 20, 38, 0.95)";
  hierarchyPanel.BorderColor = "#5f73ab";
  hierarchyPanel.BorderWidth = 1;
  hierarchyPanel.BorderRadius = 10;
  SetRect(hierarchyPanelNode, 14, 14, 250, 430, 0, 0);

  const hierarchyHeaderNode = CreateChild(hierarchyPanelNode, "HierarchyHeaderRow");
  const hierarchyHeaderPanel = hierarchyHeaderNode.AddComponent(Panel);
  hierarchyHeaderPanel.LayoutMode = "flow";
  hierarchyHeaderPanel.Direction = "row";
  hierarchyHeaderPanel.Gap = 6;
  hierarchyHeaderPanel.AlignItems = "center";
  hierarchyHeaderPanel.JustifyContent = "space-between";

  const hierarchyDragHandleNode = CreateChild(hierarchyHeaderNode, "HierarchyDragHandle");
  const hierarchyDragHandleButton = hierarchyDragHandleNode.AddComponent(Button);
  hierarchyDragHandleButton.LayoutMode = "flow";
  hierarchyDragHandleButton.Label = "Hierarchy";
  hierarchyDragHandleButton.FontSize = 16;
  hierarchyDragHandleButton.Padding = "6px 10px";
  hierarchyDragHandleButton.BackgroundColor = "#51639f";
  hierarchyDragHandleButton.BorderColor = "#8ba2ef";
  hierarchyDragHandleButton.BorderRadius = 7;

  const hierarchyCloseNode = CreateChild(hierarchyHeaderNode, "HierarchyCloseButton");
  const hierarchyCloseButton = hierarchyCloseNode.AddComponent(Button);
  hierarchyCloseButton.LayoutMode = "flow";
  hierarchyCloseButton.Label = "×";
  hierarchyCloseButton.FontSize = 16;
  hierarchyCloseButton.Padding = "6px 10px";
  hierarchyCloseButton.BackgroundColor = "#6f4a5f";
  hierarchyCloseButton.BorderColor = "#b8819f";
  hierarchyCloseButton.BorderRadius = 7;

  const hierarchyListNode = CreateChild(hierarchyPanelNode, "HierarchyList");
  const hierarchyList = hierarchyListNode.AddComponent(Panel);
  hierarchyList.LayoutMode = "flow";
  hierarchyList.Direction = "column";
  hierarchyList.Gap = 6;
  hierarchyList.OverflowY = "auto";
  SetRect(hierarchyListNode, 0, 0, 220, 340);

  const inspectorPanelNode = CreateChild(editorRoot, "InspectorPanel");
  const inspectorPanel = inspectorPanelNode.AddComponent(Panel);
  inspectorPanel.LayoutMode = "absolute";
  inspectorPanel.Direction = "column";
  inspectorPanel.Gap = 8;
  inspectorPanel.Padding = 12;
  inspectorPanel.BackgroundColor = "rgba(15, 20, 38, 0.95)";
  inspectorPanel.BorderColor = "#5f73ab";
  inspectorPanel.BorderWidth = 1;
  inspectorPanel.BorderRadius = 10;
  SetRect(inspectorPanelNode, canvas.width - 14, 14, 290, 430, 1, 0);

  const inspectorHeaderNode = CreateChild(inspectorPanelNode, "InspectorHeaderRow");
  const inspectorHeaderPanel = inspectorHeaderNode.AddComponent(Panel);
  inspectorHeaderPanel.LayoutMode = "flow";
  inspectorHeaderPanel.Direction = "row";
  inspectorHeaderPanel.Gap = 6;
  inspectorHeaderPanel.AlignItems = "center";
  inspectorHeaderPanel.JustifyContent = "space-between";

  const inspectorDragHandleNode = CreateChild(inspectorHeaderNode, "InspectorDragHandle");
  const inspectorDragHandleButton = inspectorDragHandleNode.AddComponent(Button);
  inspectorDragHandleButton.LayoutMode = "flow";
  inspectorDragHandleButton.Label = "Inspector";
  inspectorDragHandleButton.FontSize = 16;
  inspectorDragHandleButton.Padding = "6px 10px";
  inspectorDragHandleButton.BackgroundColor = "#51639f";
  inspectorDragHandleButton.BorderColor = "#8ba2ef";
  inspectorDragHandleButton.BorderRadius = 7;

  const inspectorCloseNode = CreateChild(inspectorHeaderNode, "InspectorCloseButton");
  const inspectorCloseButton = inspectorCloseNode.AddComponent(Button);
  inspectorCloseButton.LayoutMode = "flow";
  inspectorCloseButton.Label = "×";
  inspectorCloseButton.FontSize = 16;
  inspectorCloseButton.Padding = "6px 10px";
  inspectorCloseButton.BackgroundColor = "#6f4a5f";
  inspectorCloseButton.BorderColor = "#b8819f";
  inspectorCloseButton.BorderRadius = 7;

  const inspectorTargetTitle = CreateLabel(inspectorPanelNode, "InspectorTargetTitle", "Target: MachinePage", 16);
  inspectorTargetTitle.FontWeight = "600";

  const inspectorBodyText = CreateLabel(inspectorPanelNode, "InspectorBody", "No object selected.", 13);
  inspectorBodyText.Color = "#c6d2f6";
  inspectorBodyText.TextAlign = "left";

  return {
    root: pageRoot,
    topRow: topRowNode,
    walletRow: walletRowNode,
    machine4ModeRow: machine4ModeRowNode,
    board: boardNode,
    actionRow: actionRowNode,
    machineTitleText,
    machineStatusText,
    stateText,
    modeText,
    balanceText,
    betText,
    totalRewardText,
    rewardText,
    spinButton,
    addBetButton,
    subBetButton,
    showRuleButton,
    backButton,
    editModeButton,
    hierarchyToggleButton,
    inspectorToggleButton,
    normalModeButton,
    freeSpinModeButton,
    machine4SpeedToggleButton,
    closeRuleButton,
    ruleBodyText,
    ruleOverlayPanel: overlayPanel,
    ruleDismissButton,
    ruleOverlay,
    editorRoot,
    editorRootPanel,
    hierarchyPanelObject: hierarchyPanelNode,
    inspectorPanelObject: inspectorPanelNode,
    hierarchyPanel,
    inspectorPanel,
    hierarchyDragHandleButton,
    inspectorDragHandleButton,
    hierarchyCloseButton,
    inspectorCloseButton,
    hierarchyListPanel: hierarchyList,
    inspectorTitleText: inspectorTargetTitle,
    inspectorBodyText,
    cellTexts,
    cellPanels,
    boardPanel,
  };
}

const canvas = document.getElementById("game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Cannot find canvas #game-canvas.");
}

canvas.style.background = "#0b0f1f";

const engine = new Engine(canvas);

const uiRoot = new GameObject("UIRoot");
const uiCanvas = uiRoot.AddComponent(Canvas);
uiCanvas.LayoutMode = "absolute";
uiCanvas.BackgroundColor = "transparent";

const machines: MachineEntry[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  status: "BASE",
}));

const loginView = BuildLoginPage(uiRoot, canvas);
const machineView = BuildMachinePage(uiRoot, canvas);
let lobbyView: LobbyViewRefs;

let loginMode: LoginMode = "email";
let selectedMachine: MachineEntry | null = null;
let machine4Mode: Machine4Mode = "normal";
let machine4FreeSpinsRemaining = 0;
let machine4Accelerated = false;
let balance = 1000;
let currentBet = 10;
let totalRewards = 0;
let activeGridConfig: MachineGridConfig = GRID_CONFIG_3X3;
let machine3ReelAxes: ReelAxis[] = CreateReelAxes(MACHINE3_REEL_COUNT);
let machine4ReelAxes: ReelAxis[] = CreateReelAxes(MACHINE4_REEL_COUNT);
let currentGrid: SlotSymbol[] = GetGridFromReelAxes(machine3ReelAxes, MACHINE_ROWS);
let spinInProgress = false;
let spinCancellationToken = 0;
let winLineLoopToken = 0;
let editorModeEnabled = false;
let hierarchyPanelVisible = true;
let inspectorPanelVisible = true;
let selectedHierarchyKey = "";
const hierarchyNodeMap = new Map<string, GameObject>();
const hierarchyRowMap = new Map<string, HTMLDivElement>();

const ActivateTabButton = (button: Button, active: boolean): void => {
  button.BackgroundColor = active ? "#3f8cff" : "#2d3552";
  button.BorderColor = active ? "#3f8cff" : "#56638d";
  button.TextColor = "#ffffff";
};

const ApplyLoginMode = (): void => {
  const isEmailMode = loginMode === "email";
  loginView.emailForm.SetActive(isEmailMode);
  loginView.phoneForm.SetActive(!isEmailMode);
  ActivateTabButton(loginView.emailModeButton, isEmailMode);
  ActivateTabButton(loginView.phoneModeButton, !isEmailMode);
  loginView.statusText.Value = isEmailMode ? "Email mode is active." : "Phone mode is active.";
  loginView.statusText.Color = "#9ba8d5";
};

const UpdateMachineHud = (): void => {
  machineView.balanceText.Value = `Balance: ${balance}`;
  machineView.betText.Value = `Bet: ${currentBet}`;
  machineView.totalRewardText.Value = `Total Reward: ${totalRewards}`;
};

const GetBoardCellIndex = (row: number, column: number): number => {
  return row * MACHINE_MAX_COLUMNS + column;
};

const GetCompactCellIndex = (row: number, column: number, columnCount: number): number => {
  return row * columnCount + column;
};

const CompactCellIndexToBoardIndex = (compactIndex: number, columnCount: number): number => {
  const row = Math.floor(compactIndex / columnCount);
  const column = compactIndex % columnCount;
  return GetBoardCellIndex(row, column);
};

const GetBoardColumnCellIndices = (columnCount: number): number[][] => {
  const columnCellIndices: number[][] = [];
  for (let column = 0; column < columnCount; column += 1) {
    const columnIndices: number[] = [];
    for (let row = 0; row < MACHINE_ROWS; row += 1) {
      columnIndices.push(GetBoardCellIndex(row, column));
    }
    columnCellIndices.push(columnIndices);
  }
  return columnCellIndices;
};

const GetMachineGridConfig = (machineId: number): MachineGridConfig => {
  return machineId === 4 ? GRID_CONFIG_3X4 : GRID_CONFIG_3X3;
};

const SetModeButtonActiveStyle = (button: Button, active: boolean): void => {
  button.BackgroundColor = active ? "#3f8cff" : "#445283";
  button.BorderColor = active ? "#7fb2ff" : "#748ccf";
  button.TextColor = "#ffffff";
};

const RollMachine4FreeSpinCount = (): number => {
  return Math.floor(Math.random() * (MACHINE4_FREE_SPIN_MAX_COUNT - MACHINE4_FREE_SPIN_MIN_COUNT + 1)) + MACHINE4_FREE_SPIN_MIN_COUNT;
};

const SetMachine4SpeedButtonStyle = (accelerated: boolean): void => {
  machineView.machine4SpeedToggleButton.Label = accelerated ? "Speed: Accelerate" : "Speed: Normal";
  machineView.machine4SpeedToggleButton.BackgroundColor = accelerated ? "#3f8cff" : "#445283";
  machineView.machine4SpeedToggleButton.BorderColor = accelerated ? "#7fb2ff" : "#748ccf";
  machineView.machine4SpeedToggleButton.TextColor = "#ffffff";
};

const SetMachine4Accelerated = (accelerated: boolean): void => {
  machine4Accelerated = accelerated;
  SetMachine4SpeedButtonStyle(machine4Accelerated);
  RefreshMachineHeader();
  UpdateRuleTextForCurrentMachine();
  Debug.Log(`[Machine4] Speed mode -> ${machine4Accelerated ? "Accelerate" : "Normal"}`);
};

const UpdateRuleTextForCurrentMachine = (): void => {
  const machineId = selectedMachine?.id ?? 0;
  machineView.ruleBodyText.Value = BuildMachineRuleText(
    machineId,
    activeGridConfig,
    machine4Mode,
    machine4FreeSpinsRemaining,
    machine4Accelerated,
  );
};

const RefreshMachineHeader = (): void => {
  const machine = selectedMachine;
  if (machine === null) {
    machineView.machineStatusText.Value = "Status: BASE";
    machineView.modeText.Value = "Mode: --";
    return;
  }

  if (machine.id === 4) {
    const modeSuffix =
      machine4Mode === "freeSpin"
        ? `${MACHINE4_MODE_LABEL[machine4Mode]} (${machine4FreeSpinsRemaining})`
        : MACHINE4_MODE_LABEL[machine4Mode];
    const speedSuffix = machine4Accelerated ? "Accelerate" : "Normal";
    machineView.machineStatusText.Value = `Status: ${machine.status} | Mode: ${modeSuffix} | Speed: ${speedSuffix}`;
    machineView.modeText.Value = `Mode: ${modeSuffix}`;
    return;
  }

  machineView.machineStatusText.Value = `Status: ${machine.status}`;
  machineView.modeText.Value = "Mode: --";
};

const SetMachine4Mode = (mode: Machine4Mode): void => {
  if (mode === "freeSpin" && machine4FreeSpinsRemaining <= 0) {
    machine4Mode = "normal";
  } else {
    machine4Mode = mode;
  }

  machineView.freeSpinModeButton.Label =
    machine4FreeSpinsRemaining > 0 ? `FreeSpin x${machine4FreeSpinsRemaining}` : "FreeSpin";
  SetModeButtonActiveStyle(machineView.normalModeButton, machine4Mode === "normal");
  SetModeButtonActiveStyle(machineView.freeSpinModeButton, machine4Mode === "freeSpin");
  RefreshMachineHeader();
  UpdateRuleTextForCurrentMachine();
  Debug.Log(
    `[Machine4] Mode -> ${MACHINE4_MODE_LABEL[machine4Mode]} (freeSpins=${machine4FreeSpinsRemaining})`,
  );
};

const SetMachine4ModeVisible = (visible: boolean): void => {
  machineView.machine4ModeRow.SetActive(visible);
  machineView.normalModeButton.Interactable = visible;
  machineView.freeSpinModeButton.Interactable = false;
  machineView.machine4SpeedToggleButton.Interactable = visible;
};

const ApplyMachineGridConfig = (gridConfig: MachineGridConfig): void => {
  activeGridConfig = gridConfig;
  const boardRectTransform = machineView.board.GetComponent(RectTransform);
  if (boardRectTransform !== null) {
    const boardWidth = gridConfig.columns === MACHINE4_REEL_COUNT ? 520 : 400;
    boardRectTransform.sizeDelta = new Vector2(boardWidth, 330);
  }

  for (let row = 0; row < MACHINE_ROWS; row += 1) {
    for (let column = 0; column < MACHINE_MAX_COLUMNS; column += 1) {
      const boardCellIndex = GetBoardCellIndex(row, column);
      const visible = row < gridConfig.rows && column < gridConfig.columns;
      const cellPanel = machineView.cellPanels[boardCellIndex];
      cellPanel.Visible = visible;
      cellPanel.Interactable = visible;
      if (!visible) {
        machineView.cellTexts[boardCellIndex].Value = "-";
      }
    }
  }

  UpdateRuleTextForCurrentMachine();
  Debug.Log(`[Machine] Apply grid layout ${gridConfig.rows}x${gridConfig.columns}.`);
};

const ResetCellHighlight = (): void => {
  for (const cellPanel of machineView.cellPanels) {
    cellPanel.BorderColor = "#4a5e91";
    cellPanel.BorderWidth = 1;
  }
};

const RenderGrid = (grid: readonly SlotSymbol[]): void => {
  const expectedCells = activeGridConfig.rows * activeGridConfig.columns;
  if (grid.length !== expectedCells) {
    Debug.LogWarning(`[Grid] Render mismatch. expected=${expectedCells}, actual=${grid.length}`);
  }
  for (let row = 0; row < activeGridConfig.rows; row += 1) {
    for (let column = 0; column < activeGridConfig.columns; column += 1) {
      const compactIndex = GetCompactCellIndex(row, column, activeGridConfig.columns);
      const boardCellIndex = GetBoardCellIndex(row, column);
      machineView.cellTexts[boardCellIndex].Value = grid[compactIndex] ?? "-";
    }
  }
};

const HighlightWinningLines = (lineIndices: readonly number[]): void => {
  for (const lineIndex of lineIndices) {
    const payline = activeGridConfig.paylines[lineIndex];
    if (payline === undefined) {
      continue;
    }
    for (const compactCellIndex of payline) {
      const boardCellIndex = CompactCellIndexToBoardIndex(compactCellIndex, activeGridConfig.columns);
      const cellPanel = machineView.cellPanels[boardCellIndex];
      if (cellPanel === undefined) {
        continue;
      }
      cellPanel.BorderColor = "#ffd76a";
      cellPanel.BorderWidth = 2;
    }
  }
};

const SetRewardMessage = (message: string, color = "#95a6df"): void => {
  machineView.rewardText.Value = message;
  machineView.rewardText.Color = color;
};

const SetSpinState = (state: SpinState): void => {
  Debug.Log(`[Spin] State -> ${state}`);
  machineView.stateText.Value = SPIN_STATE_LABEL[state];
};

const ResetReelVisualTransforms = (): void => {
  for (const cellPanel of machineView.cellPanels) {
    const element = cellPanel.Element;
    element.style.transform = "translateY(0px)";
    element.style.transition = "none";
  }
};

const TriggerMachine3ReelMoveVisual = (): void => {
  const machine3ColumnCellIndices = GetBoardColumnCellIndices(MACHINE3_REEL_COUNT);
  for (let column = 0; column < machine3ColumnCellIndices.length; column += 1) {
    const indices = machine3ColumnCellIndices[column];
    const delayMs = column * 14;
    setTimeout(() => {
      for (const index of indices) {
        const element = machineView.cellPanels[index].Element;
        element.style.transition = "transform 90ms linear";
        element.style.transform = "translateY(12px)";
      }
      setTimeout(() => {
        for (const index of indices) {
          const element = machineView.cellPanels[index].Element;
          element.style.transform = "translateY(0px)";
        }
      }, 0);
    }, delayMs);
  }
};

const GetMachine4ActiveColumns = (elapsedMs: number): number[] => {
  if (machine4Accelerated) {
    return Array.from({ length: MACHINE4_REEL_COUNT }, (_, index) => index);
  }

  const activeColumns: number[] = [];
  for (let column = 0; column < MACHINE4_REEL_COUNT; column += 1) {
    const columnStartMs = column * MACHINE4_SEQUENTIAL_START_GAP_MS;
    if (elapsedMs >= columnStartMs) {
      activeColumns.push(column);
    }
  }
  return activeColumns;
};

const TriggerMachine4ReelMoveVisual = (activeColumns: readonly number[]): void => {
  const machine4ColumnCellIndices = GetBoardColumnCellIndices(MACHINE4_REEL_COUNT);
  for (const column of activeColumns) {
    const indices = machine4ColumnCellIndices[column];
    if (indices === undefined) {
      continue;
    }
    for (const index of indices) {
      const element = machineView.cellPanels[index].Element;
      element.style.transition = "transform 85ms linear";
      element.style.transform = "translateY(12px)";
    }
  }
  setTimeout(() => {
    for (const column of activeColumns) {
      const indices = machine4ColumnCellIndices[column];
      if (indices === undefined) {
        continue;
      }
      for (const index of indices) {
        const element = machineView.cellPanels[index].Element;
        element.style.transform = "translateY(0px)";
      }
    }
  }, 0);
};

const PlayMachine4SpinByStartMode = async (
  finalGrid: readonly SlotSymbol[],
  shouldContinue: () => boolean,
): Promise<void> => {
  ResetReelVisualTransforms();
  SetSpinState(machine4Accelerated ? "accelerate" : "constant");

  const spinDurationMs = machine4Accelerated ? 640 : 980;
  const stepMs = machine4Accelerated ? 56 : 72;
  const startTime = Date.now();

  while (true) {
    if (!shouldContinue()) {
      ResetReelVisualTransforms();
      return;
    }
    const elapsedBeforeStep = Date.now() - startTime;
    if (elapsedBeforeStep >= spinDurationMs) {
      break;
    }

    await Sleep(stepMs);
    if (!shouldContinue()) {
      ResetReelVisualTransforms();
      return;
    }

    const elapsedAfterStep = Date.now() - startTime;
    const activeColumns = GetMachine4ActiveColumns(elapsedAfterStep);
    if (activeColumns.length === 0) {
      continue;
    }

    StepReelAxesDownByColumns(machine4ReelAxes, activeColumns);
    currentGrid = GetGridFromReelAxes(machine4ReelAxes, MACHINE_ROWS);
    RenderGrid(currentGrid);
    TriggerMachine4ReelMoveVisual(activeColumns);
  }

  if (!shouldContinue()) {
    ResetReelVisualTransforms();
    return;
  }

  AlignReelAxesToTargetGrid(machine4ReelAxes, finalGrid, MACHINE_ROWS, MACHINE4_REEL_COUNT);
  currentGrid = GetGridFromReelAxes(machine4ReelAxes, MACHINE_ROWS);
  RenderGrid(currentGrid);
  ResetReelVisualTransforms();
  SetSpinState("stop");
};

const SetMachineInteractable = (value: boolean): void => {
  machineView.spinButton.Interactable = value;
  machineView.addBetButton.Interactable = value;
  machineView.subBetButton.Interactable = value;
  machineView.showRuleButton.Interactable = value;
  const machine4ModeInteractable = value && selectedMachine?.id === 4;
  machineView.normalModeButton.Interactable = machine4ModeInteractable && machine4FreeSpinsRemaining <= 0;
  machineView.freeSpinModeButton.Interactable = false;
  machineView.machine4SpeedToggleButton.Interactable = machine4ModeInteractable;
};

const SetRuleOverlayVisible = (visible: boolean): void => {
  Debug.Log(`[UI] Rule overlay visible -> ${visible}`);
  machineView.ruleOverlayPanel.Visible = visible;
  machineView.ruleOverlayPanel.Interactable = visible;
  machineView.ruleDismissButton.Interactable = visible;
  machineView.closeRuleButton.Interactable = visible;
};

const GetHierarchyNodeKey = (gameObject: GameObject): string => {
  return `go-${gameObject.InstanceID}`;
};

const RebuildHierarchyTree = (): void => {
  const hierarchyRootElement = machineView.hierarchyListPanel.Element;
  hierarchyRootElement.innerHTML = "";
  hierarchyNodeMap.clear();
  hierarchyRowMap.clear();

  const AppendNode = (gameObject: GameObject, depth: number): void => {
    const key = GetHierarchyNodeKey(gameObject);
    hierarchyNodeMap.set(key, gameObject);

    const row = document.createElement("div");
    row.style.padding = "6px 8px";
    row.style.paddingLeft = `${8 + depth * 16}px`;
    row.style.borderRadius = "6px";
    row.style.cursor = "pointer";
    row.style.fontSize = "13px";
    row.style.color = "#d8e3ff";
    row.style.whiteSpace = "nowrap";
    row.style.overflow = "hidden";
    row.style.textOverflow = "ellipsis";
    const hasChild = gameObject.transform.childCount > 0;
    row.textContent = `${hasChild ? "▾" : "•"} ${gameObject.name}`;
    row.addEventListener("click", () => {
      SelectHierarchyNode(key);
    });
    hierarchyRootElement.appendChild(row);
    hierarchyRowMap.set(key, row);

    for (const childTransform of gameObject.transform.Children) {
      AppendNode(childTransform.gameObject, depth + 1);
    }
  };

  AppendNode(machineView.root, 0);
};

const GetHierarchyTargetByKey = (key: string): GameObject => {
  return hierarchyNodeMap.get(key) ?? machineView.root;
};

const UpdateInspectorForSelection = (): void => {
  const target = GetHierarchyTargetByKey(selectedHierarchyKey);
  const componentNames = target
    ._GetAllComponents()
    .map((component) => component.constructor.name)
    .join(", ");
  machineView.inspectorTitleText.Value = `Target: ${selectedHierarchyKey}`;
  machineView.inspectorBodyText.Value = [
    `Name: ${target.name}`,
    `ActiveSelf: ${target.activeSelf}`,
    `ActiveInHierarchy: ${target.activeInHierarchy}`,
    `Components: ${componentNames || "None"}`,
    `ChildCount: ${target.transform.childCount}`,
    `Position: (${target.transform.position.x.toFixed(2)}, ${target.transform.position.y.toFixed(2)}, ${target.transform.position.z.toFixed(2)})`,
  ].join("\n");
};

const RefreshHierarchyButtonStyles = (): void => {
  for (const [key, row] of hierarchyRowMap.entries()) {
    const active = key === selectedHierarchyKey;
    row.style.background = active ? "#5b6fb0" : "transparent";
    row.style.color = active ? "#ffffff" : "#d8e3ff";
  }
};

const SelectHierarchyNode = (key: string): void => {
  const target = hierarchyNodeMap.get(key);
  if (target === undefined) {
    selectedHierarchyKey = GetHierarchyNodeKey(machineView.root);
  } else {
    selectedHierarchyKey = key;
    Debug.Log(`[Editor] Select hierarchy node: ${target.name}`);
  }
  RefreshHierarchyButtonStyles();
  UpdateInspectorForSelection();
};

const SetHierarchyPanelVisible = (visible: boolean): void => {
  hierarchyPanelVisible = visible;
  machineView.hierarchyPanel.Visible = visible;
  machineView.hierarchyPanel.Interactable = visible;
  machineView.hierarchyToggleButton.BackgroundColor = visible ? "#5b6fb0" : "#445283";
  machineView.hierarchyToggleButton.BorderColor = visible ? "#9db4ff" : "#748ccf";
  Debug.Log(`[Editor] Hierarchy panel visible -> ${visible}`);
};

const SetInspectorPanelVisible = (visible: boolean): void => {
  inspectorPanelVisible = visible;
  machineView.inspectorPanel.Visible = visible;
  machineView.inspectorPanel.Interactable = visible;
  machineView.inspectorToggleButton.BackgroundColor = visible ? "#5b6fb0" : "#445283";
  machineView.inspectorToggleButton.BorderColor = visible ? "#9db4ff" : "#748ccf";
  Debug.Log(`[Editor] Inspector panel visible -> ${visible}`);
};

const SetEditorModeEnabled = (enabled: boolean): void => {
  editorModeEnabled = enabled;
  machineView.editorRootPanel.Visible = enabled;
  // Keep root panel click-through, only child panels handle pointer events.
  machineView.editorRootPanel.Interactable = false;
  machineView.editModeButton.Label = enabled ? "Edit Mode: ON" : "Edit Mode";
  machineView.editModeButton.BackgroundColor = enabled ? "#5b6fb0" : "#444f7f";
  machineView.editModeButton.BorderColor = enabled ? "#9db4ff" : "#7385c6";
  machineView.hierarchyToggleButton.Interactable = enabled;
  machineView.inspectorToggleButton.Interactable = enabled;
  Debug.Log(`[Editor] Edit mode -> ${enabled}`);
  if (enabled) {
    RebuildHierarchyTree();
    if (selectedHierarchyKey === "") {
      selectedHierarchyKey = GetHierarchyNodeKey(machineView.root);
    }
    SetHierarchyPanelVisible(hierarchyPanelVisible);
    SetInspectorPanelVisible(inspectorPanelVisible);
    SelectHierarchyNode(selectedHierarchyKey);
    return;
  }
  machineView.hierarchyPanel.Visible = false;
  machineView.hierarchyPanel.Interactable = false;
  machineView.inspectorPanel.Visible = false;
  machineView.inspectorPanel.Interactable = false;
};

const MakePanelDraggable = (dragButton: Button, panelObject: GameObject): void => {
  const handle = dragButton.Element;
  handle.style.cursor = "grab";
  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  handle.addEventListener("pointerdown", (event) => {
    if (!editorModeEnabled || event.button !== 0) {
      return;
    }
    dragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    handle.setPointerCapture(event.pointerId);
    handle.style.cursor = "grabbing";
    event.preventDefault();
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }
    const rectTransform = panelObject.GetComponent(RectTransform);
    if (rectTransform === null) {
      return;
    }
    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    previousX = event.clientX;
    previousY = event.clientY;
    rectTransform.anchoredPosition = rectTransform.anchoredPosition.Add(new Vector2(deltaX, deltaY));
  });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    handle.releasePointerCapture(event.pointerId);
    handle.style.cursor = "grab";
  });

  handle.addEventListener("pointercancel", () => {
    dragging = false;
    handle.style.cursor = "grab";
  });
};

const StopWinLineLoop = (): void => {
  winLineLoopToken += 1;
  ResetCellHighlight();
};

const StartWinLineLoop = (lineWins: readonly LineWin[]): void => {
  StopWinLineLoop();
  if (lineWins.length === 0) {
    return;
  }

  const orderedWins = [...lineWins].sort((left, right) => left.amount - right.amount);
  const localToken = winLineLoopToken;

  const Loop = async (): Promise<void> => {
    while (localToken === winLineLoopToken && machineView.root.activeSelf && selectedMachine?.id === 3) {
      for (const lineWin of orderedWins) {
        if (localToken !== winLineLoopToken || !machineView.root.activeSelf || selectedMachine?.id !== 3) {
          return;
        }

        ResetCellHighlight();
        HighlightWinningLines([lineWin.lineIndex]);
        const paylineName = activeGridConfig.paylineNames[lineWin.lineIndex] ?? `Line ${lineWin.lineIndex + 1}`;
        SetRewardMessage(
          `Line ${paylineName} WIN +${lineWin.amount} (${lineWin.symbol})`,
          "#ffd76a",
        );
        await Sleep(680);
      }
    }
  };

  Loop().catch((error: unknown) => {
    Debug.LogError(error);
  });
};

const PlayMachine3SpinByStateMachine = async (
  finalGrid: readonly SlotSymbol[],
  shouldContinue: () => boolean,
): Promise<void> => {
  ResetReelVisualTransforms();
  SetSpinState("accelerate");
  await RunStateRollingPhaseForReelAxes(
    machine3ReelAxes,
    MACHINE_ROWS,
    520,
    (progress) => 180 - 120 * progress,
    shouldContinue,
    (grid) => {
      currentGrid = grid;
      RenderGrid(currentGrid);
    },
    TriggerMachine3ReelMoveVisual,
  );
  if (!shouldContinue()) {
    ResetReelVisualTransforms();
    return;
  }

  SetSpinState("constant");
  await RunStateRollingPhaseForReelAxes(
    machine3ReelAxes,
    MACHINE_ROWS,
    760,
    () => 55,
    shouldContinue,
    (grid) => {
      currentGrid = grid;
      RenderGrid(currentGrid);
    },
    TriggerMachine3ReelMoveVisual,
  );
  if (!shouldContinue()) {
    ResetReelVisualTransforms();
    return;
  }

  SetSpinState("decelerate");
  await RunStateRollingPhaseForReelAxes(
    machine3ReelAxes,
    MACHINE_ROWS,
    640,
    (progress) => 60 + 160 * progress,
    shouldContinue,
    (grid) => {
      currentGrid = grid;
      RenderGrid(currentGrid);
    },
    TriggerMachine3ReelMoveVisual,
  );
  if (!shouldContinue()) {
    ResetReelVisualTransforms();
    return;
  }

  SetSpinState("callback");
  await PlayMachine3CallbackEffect(machineView);
  if (!shouldContinue()) {
    return;
  }

  AlignReelAxesToTargetGrid(machine3ReelAxes, finalGrid, MACHINE_ROWS, MACHINE3_REEL_COUNT);
  SetSpinState("stop");
  currentGrid = GetGridFromReelAxes(machine3ReelAxes, MACHINE_ROWS);
  RenderGrid(currentGrid);
  ResetReelVisualTransforms();
};

const OpenMachinePage = (machine: MachineEntry): void => {
  StopWinLineLoop();
  selectedMachine = machine;
  const gridConfig = GetMachineGridConfig(machine.id);
  ApplyMachineGridConfig(gridConfig);
  if (machine.id === 4) {
    SetMachine4ModeVisible(true);
    if (machine4FreeSpinsRemaining > 0) {
      SetMachine4Mode("freeSpin");
    } else {
      SetMachine4Mode("normal");
    }
    SetMachine4Accelerated(false);
  } else {
    SetMachine4ModeVisible(false);
    RefreshMachineHeader();
  }
  if (machine.id === 3) {
    currentGrid = GetGridFromReelAxes(machine3ReelAxes, gridConfig.rows);
  } else if (machine.id === 4) {
    currentGrid = GetGridFromReelAxes(machine4ReelAxes, gridConfig.rows);
  } else {
    currentGrid = SpinSymbols(gridConfig.rows * gridConfig.columns);
  }
  machineView.machineTitleText.Value = `Machine ${machine.id.toString().padStart(2, "0")}`;
  SetSpinState("stop");
  lobbyView.root.SetActive(false);
  machineView.root.SetActive(true);
  SetRuleOverlayVisible(false);
  SetEditorModeEnabled(false);
  RebuildHierarchyTree();
  selectedHierarchyKey = GetHierarchyNodeKey(machineView.root);
  SelectHierarchyNode(selectedHierarchyKey);
  ResetReelVisualTransforms();
  UpdateMachineHud();
  SetMachineInteractable(true);
  ResetCellHighlight();
  RenderGrid(currentGrid);
  SetRewardMessage("Press SPIN to play.");
  Debug.Log(
    `Enter machine ${machine.id.toString().padStart(2, "0")} with status ${machine.status}, layout ${gridConfig.rows}x${gridConfig.columns}.`,
  );
};

lobbyView = BuildLobbyPage(uiRoot, canvas, machines, (machine) => {
  OpenMachinePage(machine);
});

lobbyView.root.SetActive(false);
machineView.root.SetActive(false);

const HandleLogin = (): void => {
  if (loginMode === "email") {
    const email = loginView.emailInput.Text.trim();
    const password = loginView.passwordInput.Text;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      loginView.statusText.Value = "Invalid email format.";
      loginView.statusText.Color = "#ff8f8f";
      return;
    }
    if (password.length < 6) {
      loginView.statusText.Value = "Password must be at least 6 characters.";
      loginView.statusText.Color = "#ff8f8f";
      return;
    }
    lobbyView.welcomeText.Value = `Welcome ${email}`;
  } else {
    const phone = loginView.phoneInput.Text.trim();
    const code = loginView.codeInput.Text.trim();
    const phoneValid = /^\+?[0-9]{6,15}$/.test(phone);
    const codeValid = /^[0-9]{4,8}$/.test(code);
    if (!phoneValid) {
      loginView.statusText.Value = "Invalid phone number format.";
      loginView.statusText.Color = "#ff8f8f";
      return;
    }
    if (!codeValid) {
      loginView.statusText.Value = "Verification code should be 4-8 digits.";
      loginView.statusText.Color = "#ff8f8f";
      return;
    }
    lobbyView.welcomeText.Value = `Welcome ${phone}`;
  }

  loginView.statusText.Value = "Login successful.";
  loginView.statusText.Color = "#95d79f";
  loginView.root.SetActive(false);
  lobbyView.root.SetActive(true);
};

const ClampBet = (nextBet: number): number => {
  if (nextBet < 1) {
    return 1;
  }
  if (nextBet > 100) {
    return 100;
  }
  return nextBet;
};

const ChangeBet = (offset: number): void => {
  currentBet = ClampBet(currentBet + offset);
  UpdateMachineHud();
};

const RunSpin = async (): Promise<void> => {
  if (spinInProgress) {
    Debug.Log("[Spin] Ignore: spin already in progress.");
    return;
  }

  const machine = selectedMachine;
  if (machine === null) {
    Debug.Log("[Spin] Reject: no selected machine.");
    SetRewardMessage("Please select a machine from lobby.", "#ff8f8f");
    return;
  }

  const isMachine4Normal = machine.id === 4 && machine4Mode === "normal";
  const isMachine4FreeSpin = machine.id === 4 && machine4Mode === "freeSpin";
  if (!isMachine4FreeSpin && balance < currentBet) {
    Debug.Log("[Spin] Reject: insufficient balance.");
    SetRewardMessage("Insufficient balance.", "#ff8f8f");
    return;
  }

  Debug.Log(
    `[Spin] Start machine=${machine.id} bet=${currentBet} balance=${balance} mode=${machine.id === 4 ? MACHINE4_MODE_LABEL[machine4Mode] : "-"} speed=${machine.id === 4 ? (machine4Accelerated ? "Accelerate" : "Normal") : "-"}`,
  );

  spinInProgress = true;
  const localSpinToken = ++spinCancellationToken;
  StopWinLineLoop();
  SetRuleOverlayVisible(false);
  SetMachineInteractable(false);

  if (!isMachine4FreeSpin) {
    balance -= currentBet;
    UpdateMachineHud();
  } else {
    Debug.Log("[Spin] Machine 4 FreeSpin mode: no bet consumed.");
  }

  const targetGrid = SpinSymbols(activeGridConfig.rows * activeGridConfig.columns);
  const ShouldContinue = (): boolean =>
    localSpinToken === spinCancellationToken && selectedMachine === machine && machineView.root.activeSelf;
  try {
    if (machine.id === 3) {
      await PlayMachine3SpinByStateMachine(targetGrid, ShouldContinue);
    } else if (machine.id === 4) {
      await PlayMachine4SpinByStartMode(targetGrid, ShouldContinue);
    } else {
      currentGrid = targetGrid;
      RenderGrid(currentGrid);
      SetSpinState("stop");
    }

    if (!ShouldContinue()) {
      Debug.Log("[Spin] Canceled before result.");
      return;
    }

    const result = EvaluatePaylines(currentGrid, currentBet, activeGridConfig);
    balance += result.totalWin;
    totalRewards += result.totalWin;
    ResetCellHighlight();
    UpdateMachineHud();

    let rewardMessage = "";
    let rewardColor = "#95a6df";
    if (result.totalWin > 0) {
      if (machine.id === 3) {
        StartWinLineLoop(result.lineWins);
      } else {
        HighlightWinningLines(result.lineWins.map((lineWin) => lineWin.lineIndex));
      }

      const lineText = result.lineWins
        .slice()
        .sort((left, right) => left.amount - right.amount)
        .map((lineWin) => {
          const paylineName = activeGridConfig.paylineNames[lineWin.lineIndex] ?? `Line ${lineWin.lineIndex + 1}`;
          return `${paylineName}(+${lineWin.amount})`;
        })
        .join(", ");
      const modeSuffix = machine.id === 4 ? ` [${MACHINE4_MODE_LABEL[machine4Mode]}]` : "";
      rewardMessage = `WIN +${result.totalWin}. ${lineText}${modeSuffix}`;
      rewardColor = "#95d79f";
    } else {
      const freeSpinSuffix = isMachine4FreeSpin ? " (FreeSpin)" : "";
      rewardMessage = `No reward this spin.${freeSpinSuffix}`;
      rewardColor = "#95a6df";
    }

    if (machine.id === 4) {
      if (isMachine4Normal) {
        const triggered = Math.random() < MACHINE4_FREE_SPIN_TRIGGER_CHANCE;
        if (triggered) {
          const freeSpinAward = RollMachine4FreeSpinCount();
          machine4FreeSpinsRemaining += freeSpinAward;
          SetMachine4Mode("freeSpin");
          rewardMessage += ` Trigger FreeSpin +${freeSpinAward}.`;
          rewardColor = "#9fe6ff";
          Debug.Log(`[Machine4] Trigger FreeSpin +${freeSpinAward}.`);
        } else {
          SetMachine4Mode("normal");
        }
      } else if (isMachine4FreeSpin) {
        if (machine4FreeSpinsRemaining > 0) {
          machine4FreeSpinsRemaining -= 1;
        }
        if (machine4FreeSpinsRemaining <= 0) {
          machine4FreeSpinsRemaining = 0;
          SetMachine4Mode("normal");
          rewardMessage += " FreeSpin finished.";
        } else {
          SetMachine4Mode("freeSpin");
          rewardMessage += ` FreeSpin left: ${machine4FreeSpinsRemaining}.`;
        }
      }
    }
    SetRewardMessage(rewardMessage, rewardColor);
  } finally {
    spinInProgress = false;
    SetMachineInteractable(true);
    Debug.Log("[Spin] End.");
  }
};

const GoBackToLobby = (): void => {
  Debug.Log("[Nav] Back to lobby requested.");
  spinCancellationToken += 1;
  spinInProgress = false;
  selectedMachine = null;
  SetMachine4ModeVisible(false);
  RefreshMachineHeader();
  UpdateRuleTextForCurrentMachine();
  SetMachineInteractable(true);
  StopWinLineLoop();
  SetSpinState("stop");
  SetRuleOverlayVisible(false);
  SetEditorModeEnabled(false);
  ResetReelVisualTransforms();
  machineView.root.SetActive(false);
  lobbyView.root.SetActive(true);
  Debug.Log("[Nav] Back to lobby completed.");
};

loginView.emailModeButton.OnClick.AddListener(() => {
  loginMode = "email";
  ApplyLoginMode();
});

loginView.phoneModeButton.OnClick.AddListener(() => {
  loginMode = "phone";
  ApplyLoginMode();
});

loginView.submitButton.OnClick.AddListener(() => {
  HandleLogin();
});

machineView.subBetButton.OnClick.AddListener(() => {
  ChangeBet(-1);
});

machineView.addBetButton.OnClick.AddListener(() => {
  ChangeBet(1);
});

machineView.normalModeButton.OnClick.AddListener(() => {
  if (selectedMachine?.id !== 4 || spinInProgress || machine4FreeSpinsRemaining > 0) {
    return;
  }
  SetMachine4Mode("normal");
  SetRewardMessage("Normal mode selected. Spinning...", "#9fe6ff");
  RunSpin();
});

machineView.freeSpinModeButton.OnClick.AddListener(() => {
  if (selectedMachine?.id !== 4 || spinInProgress || machine4FreeSpinsRemaining <= 0) {
    return;
  }
  SetMachine4Mode("freeSpin");
});

machineView.machine4SpeedToggleButton.OnClick.AddListener(() => {
  if (selectedMachine?.id !== 4 || spinInProgress) {
    return;
  }
  SetMachine4Accelerated(!machine4Accelerated);
});

machineView.spinButton.OnClick.AddListener(() => {
  RunSpin();
});

machineView.showRuleButton.OnClick.AddListener(() => {
  Debug.Log("[UI] Show rule.");
  SetRuleOverlayVisible(true);
});

machineView.closeRuleButton.OnClick.AddListener(() => {
  SetRuleOverlayVisible(false);
});

machineView.ruleDismissButton.OnClick.AddListener(() => {
  SetRuleOverlayVisible(false);
});

machineView.editModeButton.OnClick.AddListener(() => {
  SetEditorModeEnabled(!editorModeEnabled);
});

machineView.hierarchyToggleButton.OnClick.AddListener(() => {
  if (!editorModeEnabled) {
    return;
  }
  SetHierarchyPanelVisible(!hierarchyPanelVisible);
});

machineView.inspectorToggleButton.OnClick.AddListener(() => {
  if (!editorModeEnabled) {
    return;
  }
  SetInspectorPanelVisible(!inspectorPanelVisible);
});

machineView.hierarchyCloseButton.OnClick.AddListener(() => {
  SetHierarchyPanelVisible(false);
});

machineView.inspectorCloseButton.OnClick.AddListener(() => {
  SetInspectorPanelVisible(false);
});

machineView.backButton.OnClick.AddListener(() => {
  GoBackToLobby();
});

MakePanelDraggable(machineView.hierarchyDragHandleButton, machineView.hierarchyPanelObject);
MakePanelDraggable(machineView.inspectorDragHandleButton, machineView.inspectorPanelObject);

ApplyLoginMode();
UpdateMachineHud();
ApplyMachineGridConfig(GRID_CONFIG_3X3);
SetMachine4Mode("normal");
SetMachine4Accelerated(false);
SetMachine4ModeVisible(false);
RefreshMachineHeader();
RenderGrid(currentGrid);
SetSpinState("stop");
SetRuleOverlayVisible(false);
SetHierarchyPanelVisible(true);
SetInspectorPanelVisible(true);
SetEditorModeEnabled(false);
RebuildHierarchyTree();
selectedHierarchyKey = GetHierarchyNodeKey(machineView.root);
SelectHierarchyNode(selectedHierarchyKey);
SetRewardMessage("Press SPIN to play.");

engine.scene.AddGameObject(uiRoot);
engine.Start();
