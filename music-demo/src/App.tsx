import { createEffect, createSignal, For, onCleanup, onMount, type Component } from "solid-js";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "./ui/Switch";
import { LyricsScene } from "./LyricsScene";
import { createStore } from "solid-js/store";
import { effect } from "solid-js/web";
import { Texture } from "pixi.js";

const App: Component = () => {
  const [running, setRunning] = createSignal(true);

  const [state, setState] = createSignal({
    twist: true,
    blur: Array(5).fill(true) as boolean[],
    sat: true,
  });

  const canvas = <canvas class="h-screen w-screen" />;
  let scene: LyricsScene;
  onMount(() => {
    scene = new LyricsScene(
      canvas as HTMLCanvasElement,
      "https://upload.wikimedia.org/wikipedia/en/5/5a/Twenty_One_Pilots_-_Breach.png",
    );
  });
  onCleanup(() => {
    if (scene) {
      scene.destroy();
    }
  });

  let checkbox!: HTMLInputElement;
  createEffect(() => {
    const value = state().blur;
    if (scene) {
      scene.update(state());
    }
    if (
      !(
        value.every((t) => t) ||
        value.every((t) => !t)
      )
    ) {
      console.log("uh oh")
      checkbox && (checkbox.indeterminate = true);
    } else {
      checkbox && (checkbox.indeterminate = false);
      checkbox.checked = value.every((t) => t);
    }
  });

  return (
    <div>
      {canvas}
      <div class="fixed bottom-4 p-4 bg-white right-4 flex flex-col">
        <b>Controls</b>
        <button onClick={() => {
          const r = !running();
          setRunning(r);
          if (scene) {
            scene.paused = !r;
          }
        }}>{running() ? 'Stop' : 'Start'}</button>
        <input type="file" onChange={async (e) => {
          console.log("huh!")
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          console.log(url)
          const image = document.createElement('img');
          image.src = url;
          await image.decode();
          if (scene) {
            scene.updateArtwork(image)
          } else {
            scene = new LyricsScene(canvas as HTMLCanvasElement, image);
          }
        }} name="file" accept="image/*" />
        <ul>
          <li class="flex gap-2">
            <input
              type="checkbox"
              checked={state().twist}
              onChange={(e) => {
                setState(state => ({ ...state, twist: e.target.checked }));
              }}
            />
            Twist effect
          </li>
          <li class="flex flex-col">
            <div class="flex gap-2">
            <input
              type="checkbox"
              ref={checkbox}
              onChange={(e) => {
                setState(state => ({...state, blur: Array(5).fill(e.target.checked)}));
              }}
            />
            <p class="my-auto">Blur</p>
            </div>
            <ul class="ml-3">
              <For
                each={state().blur}
              >
                {(v, i) =>
                  <li class="flex gap-2">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={(e) => {
                        setState(state => {
                          const newBlurEffect = [...state.blur];
                          newBlurEffect[i()] = e.target.checked;
                          return { ...state, blur: newBlurEffect };
                        });
                      }}
                    />
                    Blur layer {i()+1}
                </li>}
              </For>
            </ul>
          </li>
          <li class="flex gap-2">
            <input
              type="checkbox"
              checked={state().sat}
              onChange={(e) => {
                setState(state => ({ ...state, sat: e.target.checked }));
              }}
            />
            Saturation
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
