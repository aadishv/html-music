import {
  Application,
  Container,
  Sprite,
  Point,
} from "pixi.js";
import { AdjustmentFilter, KawaseBlurFilter, TwistFilter } from "pixi-filters";
class LyricsScene {
  app: Application;
  reduceMotionQuery: MediaQueryList;
  container: Container;
  constructor(canvas: HTMLCanvasElement, imageSource: string) {
    this.app = new Application({
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
      view: canvas,
      backgroundAlpha: 0,
    });

    this.container = new Container();
    this.app.stage.addChild(this.container);
    const sprites = Array(4).fill(null).map(() => Sprite.from(imageSource));
    console.log(typeof Sprite);
    this.addSpritesToContainer(sprites);
    const blurFilters = [
      new KawaseBlurFilter(5, 1),
      new KawaseBlurFilter(10, 1),
      new KawaseBlurFilter(20, 2),
      new KawaseBlurFilter(40, 2),
      new KawaseBlurFilter(80, 2),
    ];
    const twist = new TwistFilter({
      angle: -3.25,
      radius: 900,
      offset: new Point(
        this.app.renderer.screen.width / 2,
        this.app.renderer.screen.height / 2,
      ),
    });
    const saturate = new AdjustmentFilter({
      saturation: 2.75,
    });
    this.container.filters = [saturate]; // [twist, ...blurFilters, saturate];
    let o = sprites.map((h) => h.rotation);
    this.app.ticker.add(() => {
      // the number of frames that have elapsed
      const n = this.app.ticker.deltaMS / 33.333333;
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
}

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
const scene = new LyricsScene(canvas, "https://www.aadishv.dev/thumbnails/light-1.jpg");
