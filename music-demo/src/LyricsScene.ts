import {
  Application,
  Container,
  Sprite,
  Point,
  SpriteSource,
} from "pixi.js";
import { AdjustmentFilter, KawaseBlurFilter, TwistFilter } from "pixi-filters";

export class LyricsScene {
  app: Application;
  container: Container;

  blurFilters: KawaseBlurFilter[];
  twist: TwistFilter;
  saturate: AdjustmentFilter;

  paused: boolean;
  constructor(canvas: HTMLCanvasElement, imageSource: SpriteSource) {
    this.app = new Application({
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
      view: canvas,
      backgroundAlpha: 0,
      powerPreference: "low-power"
    });
    this.paused = false;
    this.container = new Container();
    this.app.stage.addChild(this.container);
    this.addSpritesToContainer(Array(4).fill(null).map(() => Sprite.from(imageSource)));

    this.blurFilters = [
      new KawaseBlurFilter(5, 1),
      new KawaseBlurFilter(10, 1),
      new KawaseBlurFilter(20, 2),
      new KawaseBlurFilter(40, 2),
      new KawaseBlurFilter(80, 2),
    ];
    this.twist = new TwistFilter({
      angle: -3.25,
      radius: 900,
      offset: new Point(
        this.app.renderer.screen.width / 2,
        this.app.renderer.screen.height / 2,
      ),
    });
    this.saturate = new AdjustmentFilter({
      saturation: 2.75,
    });
    this.container.filters = [this.twist, ...this.blurFilters, this.saturate];

    this.app.ticker.add(() => {
      if (this.paused) return;
      // the number of frames that have elapsed
      const n = this.app.ticker.deltaMS / 33.333333;
      const sprites = this.container.children;
      // sprite 0
      sprites[0].rotation += 0.003 * n;
      // sprite 1
      sprites[1].rotation -= 0.008 * n;
      // sprite 2
      sprites[2].rotation -= 0.006 * n;
      sprites[2].x =
        this.app.screen.width / 2 +
        (this.app.screen.width / 4) * Math.cos(sprites[2].rotation * 0.75);
      sprites[2].y =
        this.app.screen.height / 2 +
        (this.app.screen.width / 4) * Math.sin(sprites[2].rotation * 0.75);
      // sprite 3
      sprites[3].rotation += 0.004 * n;
      sprites[3].x =
        this.app.screen.width / 2 +
        (this.app.screen.width / 2) * 0.1 +
        (this.app.screen.width / 4) * Math.cos(sprites[3].rotation * 0.75),
      sprites[3].y =
        this.app.screen.height / 2 +
        (this.app.screen.width / 2) * 0.1 +
        (this.app.screen.width / 4) * Math.sin(sprites[3].rotation * 0.75);
    });
  }
  update(options: {
    blur: boolean[],
    sat: boolean,
    twist: boolean,
  }) {
    this.container.filters = [
      ...(options.twist ? [this.twist] : []),
      ...(options.blur.map((v, i) => v ? this.blurFilters[i] : null).filter(i => i !== null)),
      ...(options.sat ? [this.saturate] : []),
    ]
  }
  updateArtwork(art: SpriteSource) {
    let sprites = Array(4).fill(null).map(() => Sprite.from(art));
    this.container.children.map(c => c as Sprite).map((c, i) => {
      sprites[i].rotation = c.rotation;
      sprites[i].x = c.x;
      sprites[i].y = c.y;
      sprites[i].anchor.set(c.anchor.x, c.anchor.y);
      sprites[i].width = c.width;
      sprites[i].height = c.height;
    })
    this.container.removeChildren(0);
    this.container.addChild(...sprites);
  }
  addSpritesToContainer(sprites: Sprite[]) {
    const [t, s, i, r] = sprites;
    (t.anchor.set(0.5, 0.5),
      s.anchor.set(0.5, 0.5),
      i.anchor.set(0.5, 0.5),
      r.anchor.set(0.5, 0.5),
      t.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
      s.position.set(this.app.screen.width / 2.5, this.app.screen.height / 2.5),
      i.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
      r.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
      (t.width = this.app.screen.width * 1.25),
      (t.height = t.width),
      (s.width = this.app.screen.width * 0.8),
      (s.height = s.width),
      (i.width = this.app.screen.width * 0.5),
      (i.height = i.width),
      (r.width = this.app.screen.width * 0.25),
      (r.height = r.width),
      this.container.addChild(t, s, i, r));
  }
  destroy() {
    if (this.app) {
      this.app.destroy(false)
    }
  }
}
