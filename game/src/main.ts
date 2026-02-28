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
  machineTitleText: Text;
  machineStatusText: Text;
  stateText: Text;
  balanceText: Text;
  betText: Text;
  totalRewardText: Text;
  rewardText: Text;
  spinButton: Button;
  addBetButton: Button;
  subBetButton: Button;
  showRuleButton: Button;
  backButton: Button;
  closeRuleButton: Button;
  ruleOverlay: GameObject;
  cellTexts: Text[];
  cellPanels: Panel[];
  boardPanel: Panel;
};

type SpinState = "accelerate" | "constant" | "decelerate" | "callback" | "stop";

type LineWin = {
  lineIndex: number;
  amount: number;
  symbol: SlotSymbol;
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

const PAYLINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const PAYLINE_NAMES = ["Top", "Middle", "Bottom", "Diagonal LR", "Diagonal RL"];

const SPIN_STATE_LABEL: Record<SpinState, string> = {
  accelerate: "State: Accelerate",
  constant: "State: Constant Speed",
  decelerate: "State: Decelerate",
  callback: "State: Callback Effect",
  stop: "State: Stop",
};

const RULE_TEXT = [
  "Rules:",
  "1) Spin costs current bet.",
  "2) Slot board is 3x3.",
  "3) Paylines:",
  "   - Top row (0,1,2)",
  "   - Middle row (3,4,5)",
  "   - Bottom row (6,7,8)",
  "   - Diagonal LR (0,4,8)",
  "   - Diagonal RL (2,4,6)",
  "4) Three same symbols in one payline wins reward.",
  "5) Reward = bet x symbol multiplier.",
  "6) Multipliers: A2 K3 Q4 J5 7x8 BAR10 STAR12.",
].join("\n");

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

function SpinSymbols(): SlotSymbol[] {
  return Array.from({ length: 9 }, () => RandomSymbol());
}

function EvaluatePaylines(symbols: SlotSymbol[], bet: number): { totalWin: number; lineWins: LineWin[] } {
  let totalWin = 0;
  const lineWins: LineWin[] = [];
  for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex += 1) {
    const [a, b, c] = PAYLINES[lineIndex];
    const symbolA = symbols[a];
    const symbolB = symbols[b];
    const symbolC = symbols[c];
    if (symbolA === symbolB && symbolB === symbolC) {
      const amount = bet * PAYOUT_MULTIPLIER[symbolA];
      totalWin += amount;
      lineWins.push({
        lineIndex,
        amount,
        symbol: symbolA,
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

function RollGridDownOneStep(grid: readonly SlotSymbol[]): SlotSymbol[] {
  const next = [...grid];
  for (let column = 0; column < 3; column += 1) {
    const topIndex = column;
    const middleIndex = 3 + column;
    const bottomIndex = 6 + column;
    next[bottomIndex] = grid[middleIndex];
    next[middleIndex] = grid[topIndex];
    next[topIndex] = RandomSymbol();
  }
  return next;
}

async function RunStateRollingPhase(
  startGrid: readonly SlotSymbol[],
  durationMs: number,
  getStepMs: (progress01: number) => number,
  onStep: (grid: SlotSymbol[]) => void,
): Promise<SlotSymbol[]> {
  let grid = [...startGrid];
  const start = Date.now();
  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed >= durationMs) {
      break;
    }
    const progress = Math.min(elapsed / durationMs, 1);
    const stepMs = Math.max(18, Math.round(getStepMs(progress)));
    await Sleep(stepMs);
    grid = RollGridDownOneStep(grid);
    onStep(grid);
  }
  return grid;
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

  const backButtonNode = CreateChild(topRowNode, "BackButton");
  const backButton = backButtonNode.AddComponent(Button);
  backButton.LayoutMode = "flow";
  backButton.Label = "Back To Lobby";
  backButton.Padding = "10px 14px";
  backButton.BackgroundColor = "#3e4c78";
  backButton.BorderColor = "#5e73b0";
  backButton.BorderRadius = 8;

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
  SetRect(boardNode, 0, 0, 400, 330);

  const cellTexts: Text[] = [];
  const cellPanels: Panel[] = [];
  for (let row = 0; row < 3; row += 1) {
    const rowNode = CreateChild(boardNode, `Row-${row}`);
    const rowPanel = rowNode.AddComponent(Panel);
    rowPanel.LayoutMode = "flow";
    rowPanel.Direction = "row";
    rowPanel.Gap = 10;
    rowPanel.AlignItems = "center";

    for (let column = 0; column < 3; column += 1) {
      const index = row * 3 + column;
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
  SetRect(ruleOverlay, 0, 0, canvas.width, canvas.height, 0, 0);

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

  const ruleBody = CreateLabel(ruleCardNode, "RuleBody", RULE_TEXT, 14);
  ruleBody.Color = "#cad6ff";
  ruleBody.TextAlign = "left";

  const closeRuleNode = CreateChild(ruleCardNode, "CloseRuleButton");
  const closeRuleButton = closeRuleNode.AddComponent(Button);
  closeRuleButton.LayoutMode = "flow";
  closeRuleButton.Label = "Close";
  closeRuleButton.Padding = "10px 14px";
  closeRuleButton.BackgroundColor = "#4f5d8f";
  closeRuleButton.BorderColor = "#7a8fd5";
  closeRuleButton.BorderRadius = 8;

  ruleOverlay.SetActive(false);

  return {
    root: pageRoot,
    machineTitleText,
    machineStatusText,
    stateText,
    balanceText,
    betText,
    totalRewardText,
    rewardText,
    spinButton,
    addBetButton,
    subBetButton,
    showRuleButton,
    backButton,
    closeRuleButton,
    ruleOverlay,
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
let balance = 1000;
let currentBet = 10;
let totalRewards = 0;
let currentGrid: SlotSymbol[] = Array.from({ length: 9 }, () => "A");
let spinInProgress = false;
let winLineLoopToken = 0;

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

const ResetCellHighlight = (): void => {
  for (const cellPanel of machineView.cellPanels) {
    cellPanel.BorderColor = "#4a5e91";
    cellPanel.BorderWidth = 1;
  }
};

const RenderGrid = (grid: readonly SlotSymbol[]): void => {
  for (let index = 0; index < machineView.cellTexts.length; index += 1) {
    machineView.cellTexts[index].Value = grid[index];
  }
};

const HighlightWinningLines = (lineIndices: readonly number[]): void => {
  for (const lineIndex of lineIndices) {
    for (const cellIndex of PAYLINES[lineIndex]) {
      const cellPanel = machineView.cellPanels[cellIndex];
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
  machineView.stateText.Value = SPIN_STATE_LABEL[state];
};

const SetMachineInteractable = (value: boolean): void => {
  machineView.spinButton.Interactable = value;
  machineView.addBetButton.Interactable = value;
  machineView.subBetButton.Interactable = value;
  machineView.backButton.Interactable = value;
  machineView.showRuleButton.Interactable = value;
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
        SetRewardMessage(
          `Line ${PAYLINE_NAMES[lineWin.lineIndex]} WIN +${lineWin.amount} (${lineWin.symbol})`,
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

const PlayMachine3SpinByStateMachine = async (finalGrid: readonly SlotSymbol[]): Promise<void> => {
  let rollingGrid = [...currentGrid];

  SetSpinState("accelerate");
  rollingGrid = await RunStateRollingPhase(rollingGrid, 520, (progress) => 180 - 120 * progress, (grid) => {
    currentGrid = grid;
    RenderGrid(currentGrid);
  });

  SetSpinState("constant");
  rollingGrid = await RunStateRollingPhase(rollingGrid, 760, () => 55, (grid) => {
    currentGrid = grid;
    RenderGrid(currentGrid);
  });

  SetSpinState("decelerate");
  rollingGrid = await RunStateRollingPhase(rollingGrid, 640, (progress) => 60 + 160 * progress, (grid) => {
    currentGrid = grid;
    RenderGrid(currentGrid);
  });

  SetSpinState("callback");
  await PlayMachine3CallbackEffect(machineView);

  SetSpinState("stop");
  currentGrid = [...finalGrid];
  RenderGrid(currentGrid);
};

const OpenMachinePage = (machine: MachineEntry): void => {
  StopWinLineLoop();
  selectedMachine = machine;
  machineView.machineTitleText.Value = `Machine ${machine.id.toString().padStart(2, "0")}`;
  machineView.machineStatusText.Value = `Status: ${machine.status}`;
  SetSpinState("stop");
  lobbyView.root.SetActive(false);
  machineView.root.SetActive(true);
  machineView.ruleOverlay.SetActive(false);
  UpdateMachineHud();
  ResetCellHighlight();
  RenderGrid(currentGrid);
  SetRewardMessage("Press SPIN to play.");
  Debug.Log(`Enter machine ${machine.id.toString().padStart(2, "0")} with status ${machine.status}.`);
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
    return;
  }

  const machine = selectedMachine;
  if (machine === null) {
    SetRewardMessage("Please select a machine from lobby.", "#ff8f8f");
    return;
  }

  if (balance < currentBet) {
    SetRewardMessage("Insufficient balance.", "#ff8f8f");
    return;
  }

  spinInProgress = true;
  StopWinLineLoop();
  machineView.ruleOverlay.SetActive(false);
  SetMachineInteractable(false);

  balance -= currentBet;
  UpdateMachineHud();

  const targetGrid = SpinSymbols();
  try {
    if (machine.id === 3) {
      await PlayMachine3SpinByStateMachine(targetGrid);
    } else {
      currentGrid = targetGrid;
      RenderGrid(currentGrid);
      SetSpinState("stop");
    }

    const result = EvaluatePaylines(currentGrid, currentBet);
    balance += result.totalWin;
    totalRewards += result.totalWin;
    ResetCellHighlight();
    UpdateMachineHud();

    if (result.totalWin > 0) {
      if (machine.id === 3) {
        StartWinLineLoop(result.lineWins);
      } else {
        HighlightWinningLines(result.lineWins.map((lineWin) => lineWin.lineIndex));
      }

      const lineText = result.lineWins
        .slice()
        .sort((left, right) => left.amount - right.amount)
        .map((lineWin) => `${PAYLINE_NAMES[lineWin.lineIndex]}(+${lineWin.amount})`)
        .join(", ");
      SetRewardMessage(`WIN +${result.totalWin}. ${lineText}`, "#95d79f");
    } else {
      SetRewardMessage("No reward this spin.", "#95a6df");
    }
  } finally {
    spinInProgress = false;
    SetMachineInteractable(true);
  }
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

machineView.spinButton.OnClick.AddListener(() => {
  RunSpin();
});

machineView.showRuleButton.OnClick.AddListener(() => {
  machineView.ruleOverlay.SetActive(true);
});

machineView.closeRuleButton.OnClick.AddListener(() => {
  machineView.ruleOverlay.SetActive(false);
});

machineView.backButton.OnClick.AddListener(() => {
  StopWinLineLoop();
  SetSpinState("stop");
  machineView.ruleOverlay.SetActive(false);
  machineView.root.SetActive(false);
  lobbyView.root.SetActive(true);
});

ApplyLoginMode();
UpdateMachineHud();
RenderGrid(currentGrid);
SetSpinState("stop");
SetRewardMessage("Press SPIN to play.");

engine.scene.AddGameObject(uiRoot);
engine.Start();
