import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
} from "@angular/core";

import * as THREE from "three";
// import { SimplexNoise } from "../SimplexNoise";
import * as SimplexNoise from "simplex-noise";

@Component({
  selector: "earth-net-mesh",
  templateUrl: "earth-net-mesh.html",
})
export class EarthNetMeshComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("canvas") canvasRef: ElementRef;
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private _floorMaterial: THREE.MeshPhongMaterial;
  @Input("auto-start") auto_start = true;
  _body_material: THREE.MeshPhongMaterial;
  _line_material: THREE.MeshPhongMaterial;
  _line_color = 0xffffff;
  _body_color = 0xffffff;
  _line_opacity = 0.25;
  _body_opacity = 0.4;
  @Input("body-color")
  set body_color(v) {
    if (v !== this._body_color && isFinite(v)) {
      this._body_color = v;
      const { _body_material } = this;
      if (_body_material) {
        const color = new THREE.Color(v);
        _body_material.color = color;
        _body_material.emissive = color;
        _body_material.specular = color;
        _body_material.needsUpdate = true;
      }
    }
  }
  get body_color() {
    return this._body_color;
  }
  @Input("body-opacity")
  set body_opacity(v) {
    if (v !== this._body_opacity && isFinite(v)) {
      this._body_opacity = v;
      const { _body_material } = this;
      if (_body_material) {
        _body_material.opacity = v;
        _body_material.needsUpdate = true;
      }
    }
  }
  get body_opacity() {
    return this._body_opacity;
  }
  @Input("line-color")
  set line_color(v) {
    if (v !== this._line_color && isFinite(v)) {
      this._line_color = v;
      const { _line_material } = this;
      if (_line_material) {
        const color = new THREE.Color(v);
        _line_material.color = color;
        _line_material.emissive = color;
        _line_material.specular = color;
        _line_material.needsUpdate = true;
      }
    }
  }
  get line_color() {
    return this._line_color;
  }
  @Input("line-opacity")
  set line_opacity(v) {
    if (v !== this._line_opacity && isFinite(v)) {
      this._line_opacity = v;
      const { _line_material } = this;
      if (_line_material) {
        _line_material.opacity = v;
        _line_material.needsUpdate = true;
      }
    }
  }
  get line_opacity() {
    return this._line_opacity;
  }

  @Input("background-color")
  get bgColor() {
    return this._bg_color;
  }
  _bg_color: THREE.Color = new THREE.Color(0x005a89);
  set bgColor(v) {
    this._bg_color = v;
    if (this._floorMaterial) {
      this._floorMaterial.color = this._bg_color;
    }
  }
  setBgColor(v: number | string | number[] | THREE.Color) {
    if (v instanceof Array) {
      this.bgColor = new THREE.Color(...v);
    } else if (typeof v === "string") {
      this.bgColor = new THREE.Color(v);
    } else if (typeof v === "number") {
      this.bgColor = new THREE.Color(v);
    } else {
      this.bgColor = v;
    }
  }

  @Input("width")
  get width() {
    return this._width;
  }
  private _width: number = window.innerWidth;
  set width(v) {
    this._width = v;
    this.resize();
  }

  @Input("height")
  get height() {
    return this._height;
  }
  private _height: number = window.innerHeight;
  set height(v) {
    this._height = v;
    this.resize();
  }
  resize() {
    // TODO:
    this.renderer.setSize(this.width, this.height);
  }

  constructor() {
    this._loop = this._loop.bind(this);
    window["earth"] = this;
  }
  // devicePixelRatio = Math.max(1, window.devicePixelRatio / 2); //window.devicePixelRatio;
  devicePixelRatio = (1 + window.devicePixelRatio) / 2; //window.devicePixelRatio;
  ngOnInit() {
    const canvas = (this.canvas = this.canvasRef.nativeElement);
    const wrapper = this.canvas.parentNode as HTMLElement;
    if (wrapper) {
      this._width = wrapper.clientWidth * this.devicePixelRatio;
      this._height = wrapper.clientHeight * this.devicePixelRatio;
    }
  }

  _init() {
    const { canvas, _loop_runs } = this;

    const scene = (this.scene = new THREE.Scene());
    const camera = (this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000,
    ));

    camera.position.z =
      Math.min(this.width, this.height) / (1.4 * this.devicePixelRatio);

    const renderer = (this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      canvas,
    }));
    renderer.setSize(this.width, this.height);

    // ---------------------------
    // 背景面板
    var floorMaterial = new THREE.MeshPhongMaterial({
      color: this._bg_color,
      specular: this._bg_color,
      side: THREE.DoubleSide,
    });
    this._floorMaterial = floorMaterial;
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.z = -100;
    // floor.rotation.x = Math.PI / 2;
    // scene.add(floor);

    const lights = [];
    {
      const dlight = new THREE.DirectionalLight(0xffffff, 0.3);
      dlight.position.set(0, 0, 400);
      lights[lights.length] = dlight;
    }
    {
      const dlight = new THREE.DirectionalLight(0xffffff, 0.5);
      dlight.position.set(0, 300, 0);
      lights[lights.length] = dlight;
    }
    {
      const dlight = new THREE.DirectionalLight(0xffffff, 0.5);
      dlight.position.set(0, -300, 0);
      lights[lights.length] = dlight;
    }
    const alight = new THREE.AmbientLight(0xffffff, 0.2);
    lights[lights.length] = alight;

    scene.add(...lights);

    const newIcosahedronGeometry = builder => {
      const { geometry, material, line } = builder() as {
        geometry: THREE.IcosahedronGeometry;
        material;
        line;
      };
      scene.add(line);
      this._mesh_list.push(line);

      const vertices = geometry.vertices;

      const noise = new SimplexNoise();
      const x_speed = 0.00001;
      const y_speed = 0.00001;
      const z_speed = 0.00001;
      const all_speed = 0.000003;

      let cur_x = 0;
      let cur_y = 0;
      let cur_z = 0;
      let cur_all = 0;
      const BaseX = new Float32Array(vertices.length);
      const BaseY = new Float32Array(vertices.length);
      const BaseZ = new Float32Array(vertices.length);
      const RateX = new Float32Array(vertices.length);
      const RateY = new Float32Array(vertices.length);
      const RateZ = new Float32Array(vertices.length);

      const R = geometry.parameters.radius;

      for (let i = 0; i < vertices.length; i += 1) {
        const point = vertices[i];

        BaseX[i] = point.x;
        BaseY[i] = point.y;
        BaseZ[i] = point.z;

        RateX[i] = point.x / R;
        RateY[i] = point.y / R;
        RateZ[i] = point.z / R;
      }

      // const colors = [];
      // for (let i = 0; i < BaseX.length; i += 1) {
      //   colors[i] = new THREE.Color(0xffffff);
      //   colors[i].setHSL(
      //     0.6,
      //     1.0,
      //     Math.max(0, (200 - BaseX[i]) / 400) * 0.5 + 0.5,
      //   );
      // }
      // geometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      /// Animate
      line.rotation.x = -Math.PI / 2;

      var animate = function() {
        // line.rotation.x -= 0.001;
        // p = f % CHANGE_FRAME_NUM;
        // if (p === 0) {
        for (let i = 0; i < vertices.length; i += 1) {
          const point = vertices[i];

          cur_all += all_speed;

          const rateX = RateX[i];
          const rateY = RateY[i];
          const rateZ = RateZ[i];

          const baseX = BaseX[i];
          const baseY = BaseY[i];
          const baseZ = BaseZ[i];

          const n = noise.noise4D(baseX, baseY, baseZ, cur_all) * 6;
          point.x = baseX + n * rateX;
          point.y = baseY + n * rateY;
          point.z = baseZ + n * rateZ;
        }
        geometry.verticesNeedUpdate = true;

        renderer.render(scene, camera);
      };
      this._loop_runs.push(animate);
    };
    _loop_runs.length = 0;

    newIcosahedronGeometry(() => {
      const geometry = new THREE.IcosahedronGeometry(95, 4);

      const material = new THREE.MeshPhongMaterial({
        color: this._body_color,
        emissive: this._body_color,
        specular: this._body_color,
        transparent: true,
        opacity: this._body_opacity,
      });
      this._body_material = material;

      const line = new THREE.Mesh(geometry, material);
      return {
        geometry,
        material,
        line,
      };
    });

    newIcosahedronGeometry(() => {
      const geometry = new THREE.IcosahedronGeometry(100, 4);

      const material = new THREE.MeshPhongMaterial({
        color: this._line_color,
        emissive: this._line_color,
        specular: this._line_color,
        shininess: 1,
        side: THREE.DoubleSide,
        // flatShading: false,
        transparent: true,
        wireframe: true,
        opacity: this._line_opacity,
        wireframeLinecap: "miter",
        shading: THREE.SmoothShading,
      });
      this._line_material = material;

      const line = new THREE.Mesh(geometry, material);
      return {
        geometry,
        material,
        line,
      };
    });
  }
  private _mesh_list: THREE.Mesh[] = [];

  ngAfterViewInit() {
    this._init();
    if (this.auto_start) {
      this.startAnimation();
    }
  }
  ngOnDestroy() {
    this.stopAnimation();
  }
  private _isStarted = false;
  startAnimation() {
    if (this._isStarted) {
      return;
    }
    this._init();

    this._isStarted = true;
    this._loop();
  }
  stopAnimation() {
    this._isStarted = false;
  }
  private _loop_runs = [];
  _loop() {
    for (let fun of this._loop_runs) {
      fun();
    }
    this._isStarted && requestAnimationFrame(this._loop);
  }

  rotateMeshsY = this._rotateMeshsDir("y");
  rotateMeshsX = this._rotateMeshsDir("x");
  rotateMeshsZ = this._rotateMeshsDir("z");
  private _rotateMeshsDir(key: "x" | "y" | "z") {
    const upKey = key.toLocaleUpperCase();
    const loop_runer_key = "_route_mesh_loop_runer_" + key;

    const stoper = (this["stopRotateMeshs" + upKey] = () => {
      var old_i = this._loop_runs.indexOf(this[loop_runer_key]);
      if (old_i > -1) {
        this._loop_runs.splice(old_i, 1);
      }
    });
    return (to_deg: number, time = 200, direction: 1 | -1 = 1) => {
      stoper();

      var from_deg = this._mesh_list[0].rotation[key] % (Math.PI * 2);
      to_deg = to_deg % (Math.PI * 2);
      var start_time = performance.now();
      var progress = 0;

      var dif_deg;
      if (direction == -1) {
        dif_deg = to_deg - from_deg;
        if (dif_deg > 0) {
          from_deg += Math.PI * 2;
        }
        dif_deg = to_deg - from_deg;
      } else {
        dif_deg = to_deg - from_deg;
        if (dif_deg < 0) {
          from_deg -= Math.PI * 2;
        }
        dif_deg = to_deg - from_deg;
      }
      console.log("dif_deg", dif_deg);

      this[loop_runer_key] = () => {
        var cur_time = performance.now();
        progress = (cur_time - start_time) / time;

        var end = false;
        for (let mesh of this._mesh_list) {
          if (progress >= 1) {
            // 动画结束
            mesh.rotation[key] = to_deg;
            end = true;
          } else {
            mesh.rotation[key] = from_deg + dif_deg * progress;
          }
        }
        if (end) {
          stoper();
        }
      };
      this._loop_runs.push(this[loop_runer_key]);
    };
  }
  stopRotateMeshsY: () => void;
  stopRotateMeshsX: () => void;
  stopRotateMeshsZ: () => void;
}
