import {
  Color,
  Engine,
  GameObject,
  Input,
  MonoBehaviour,
  Mathf,
  SpriteRenderer,
  Time,
  Vector3,
} from "@h5unity/engine";

class PlayerController extends MonoBehaviour {
  public moveSpeed = 320;
  private sprite: SpriteRenderer | null = null;

  public override Start(): void {
    this.sprite = this.gameObject.GetComponent(SpriteRenderer);
  }

  public override Update(): void {
    let horizontal = 0;
    let vertical = 0;

    if (Input.GetKey("ArrowLeft") || Input.GetKey("a")) {
      horizontal -= 1;
    }
    if (Input.GetKey("ArrowRight") || Input.GetKey("d")) {
      horizontal += 1;
    }
    if (Input.GetKey("ArrowUp") || Input.GetKey("w")) {
      vertical -= 1;
    }
    if (Input.GetKey("ArrowDown") || Input.GetKey("s")) {
      vertical += 1;
    }

    const direction = new Vector3(horizontal, vertical, 0).normalized;
    this.transform.Translate(direction.Multiply(this.moveSpeed * Time.deltaTime));

    if (Input.GetKeyDown(" ")) {
      this.ToggleColor();
    }
  }

  private ToggleColor(): void {
    if (this.sprite === null) {
      return;
    }
    const isGreen = this.sprite.Color === Color.green;
    this.sprite.Color = isGreen ? Color.blue : Color.green;
  }
}

class PulsingScale extends MonoBehaviour {
  public amplitude = 0.2;
  public speed = 3;

  public override Update(): void {
    const t = (Mathf.Sin(Time.time * this.speed) + 1) * 0.5;
    const scaleValue = Mathf.Lerp(1 - this.amplitude, 1 + this.amplitude, t);
    this.transform.localScale = new Vector3(scaleValue, scaleValue, 1);
  }
}

const canvas = document.getElementById("game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Cannot find canvas #game-canvas.");
}

const engine = new Engine(canvas);

const player = new GameObject("Player");
player.transform.position = new Vector3(canvas.width / 2, canvas.height / 2, 0);

const spriteRenderer = player.AddComponent(SpriteRenderer);
spriteRenderer.Size.x = 120;
spriteRenderer.Size.y = 120;
spriteRenderer.Color = Color.green;

player.AddComponent(PlayerController);
player.AddComponent(PulsingScale);

engine.scene.AddGameObject(player);
engine.Start();
