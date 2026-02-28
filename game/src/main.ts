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

function BuildLobbyPage(root: GameObject, canvas: HTMLCanvasElement): LobbyViewRefs {
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

  for (let index = 1; index <= 10; index += 1) {
    const machineNode = CreateChild(scrollNode, `Machine-${index}`);
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

    const machineTitle = CreateLabel(machineNode, "MachineTitle", `Machine ${index.toString().padStart(2, "0")}`, 18);
    machineTitle.FontWeight = "600";
    machineTitle.TextAlign = "center";

    const machineStatus = CreateLabel(machineNode, "MachineStatus", "Status: BASE", 14);
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
      Debug.Log(`Select machine ${index.toString().padStart(2, "0")} with status BASE.`);
    });
  }

  return {
    root: pageRoot,
    welcomeText,
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

const loginView = BuildLoginPage(uiRoot, canvas);
const lobbyView = BuildLobbyPage(uiRoot, canvas);
lobbyView.root.SetActive(false);

let loginMode: LoginMode = "email";

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

ApplyLoginMode();

engine.scene.AddGameObject(uiRoot);
engine.Start();
