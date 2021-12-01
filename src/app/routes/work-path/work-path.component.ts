import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GaodeMap, ILayer, LineLayer, Marker, Popup, Scene } from '@antv/l7';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AsyncSubject, BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from 'src/app/core/service/data.service';

@Component({
  templateUrl: './work-path.component.html',
  styles: []
})
export class WorkPathComponent implements AfterViewInit {
  @ViewChild('notificationTpl', { static: false }) template?: TemplateRef<{}>;
  constructor(private dataService: DataService, private notificationService: NzNotificationService) {}
  scene$: AsyncSubject<Scene> = new AsyncSubject<Scene>();

  stepIndex = 0;

  previewFeatures$: AsyncSubject<any> = new AsyncSubject<any>();
  specificFeatures$: AsyncSubject<any> = new AsyncSubject<any>();

  previewLineLayer$: AsyncSubject<ILayer> = new AsyncSubject<ILayer>();
  specificLineLayer$: AsyncSubject<ILayer> = new AsyncSubject<ILayer>();

  rotation = 0;

  switchToPreview() {
    forkJoin([this.scene$, this.previewLineLayer$])
      .pipe(
        map(([scene, previewRoadLineLayer]) => {
          return { scene: scene, previewRoadLineLayer: previewRoadLineLayer };
        })
      )
      .subscribe(args => {
        args.scene.setMapStyle('light');
        args.scene.setPitch(0);
        args.scene.setRotation(0);
        args.previewRoadLineLayer.fitBounds();
      });
  }

  startPoint: string = 'null';
  switchToLaneLine(start: string = this.startPoint) {
    this.stepIndex = 1;
    this.startPoint = start;
    function getPhi(x: number, y: number) {
      //y(0 ,1)
      let phi = Math.acos((x * 0 + y * 1) / Math.sqrt(x * x + y * y));
      phi = (phi / 3.14159) * 180;
      console.log(phi);
      console.log(x, y);
      if (x >= 0 && y >= 0) {
        return 360 - phi;
      } else if (x <= 0 && y >= 0) {
        return phi;
      } else if (x <= 0 && y <= 0) {
        return phi;
      } else {
        return 180 + phi;
      }
    }
    forkJoin([this.scene$, this.specificLineLayer$, this.specificFeatures$])
      .pipe(
        map(([scene, specificRoadLineLayer, specificFeatures]) => {
          return { scene: scene, specificRoadLineLayer: specificRoadLineLayer, specificFeatures: specificFeatures };
        })
      )
      .subscribe(args => {
        const specificCoordinates = args.specificFeatures['features'][0]['geometry']['coordinates'];
        args.scene.setZoom(9);
        args.scene.setPitch(60);
        args.scene.setMapStyle('blank');

        if (this.startPoint === 'front') {
          args.scene.setCenter(specificCoordinates[0]);
          let vec = [specificCoordinates[100][0] - specificCoordinates[0][0], specificCoordinates[100][1] - specificCoordinates[0][1]];
          args.scene.setRotation(getPhi(vec[0], vec[1]));
        } else if (this.startPoint === 'back') {
          args.scene.setCenter(specificCoordinates[specificCoordinates.length - 1]);

          let vec = [
            specificCoordinates[specificCoordinates.length - 100][0] - specificCoordinates[specificCoordinates.length - 1][0],
            specificCoordinates[specificCoordinates.length - 100][1] - specificCoordinates[specificCoordinates.length - 1][1]
          ];

          args.scene.setRotation(getPhi(vec[0], vec[1]));
        }
      });
  }

  switchToSpecificLine(lineId: string) {
    this.stepIndex = 2;
    forkJoin([this.scene$, this.specificFeatures$])
      .pipe(
        map(([scene, specificFeatures]) => {
          return { scene: scene, specificFeatures: specificFeatures };
        })
      )
      .subscribe(args => {
        this.rotation = args.scene.getRotation();
        args.scene.setZoom(15);
        let specificCoordinates;

        for (const feature of args.specificFeatures['features']) {
          if (feature['properties']['id'] == lineId) {
            specificCoordinates = feature['geometry']['coordinates'];
          }
        }

        if (this.startPoint === 'front') {
          args.scene.setCenter(specificCoordinates[0]);
        } else if (this.startPoint === 'back') {
          args.scene.setCenter(specificCoordinates[specificCoordinates.length - 1]);
        }

        args.scene.setRotation(this.rotation);
      });
  }

  switchToWork(index: number) {
    switch (index) {
      case 0:
        this.switchToPreview();
        break;
      case 1:
        this.switchToLaneLine();
        break;
      case 2:
        // this.switchToSpecificLine();
        break;
      case 3:
        break;
      default:
        throw new Error('no work error');
        break;
    }
  }

  onIndexChange(event: number) {
    if (event > this.stepIndex) return;
    if (event === 0) {
      this.switchToPreview();
    }
    if (event === 1) {
      this.switchToLaneLine();
    }
    this.stepIndex = event;
  }

  addScene() {
    let scene = new Scene({
      id: 'map',
      map: new GaodeMap({
        style: 'light',
        center: [116.1378, 38.9809],
        pitch: 0,
        zoom: 10.5,
        token: '932283ae0cd1bf9634220e72529f796b',
        resizeEnable: true,
        minZoom: 8
      })
    });
    scene.on('loaded', () => {
      this.scene$.next(scene);
      this.scene$.complete();
    });
  }

  addPreviewRoadLineLayer() {
    this.scene$.subscribe((scene: Scene) => {
      this.previewFeatures$.subscribe((features: any) => {
        let lineLayer = new LineLayer({ autoFit: true }).source(features).size(2).color('blue');
        scene.addLayer(lineLayer);
        this.previewLineLayer$.next(lineLayer);
        this.previewLineLayer$.complete();
      });
    });
  }

  addSpecificRoadLineLayer() {
    this.scene$.subscribe((scene: Scene) => {
      this.specificFeatures$.subscribe((features: any) => {
        let lineLayer = new LineLayer({ pickingBuffer: 5 })
          .source(features)
          .size(2)
          .color('type', lineType => {
            if (lineType === 'edge') return 'black';
            else return 'blue';
          });
        lineLayer.on('click', e => {
          let info = [`id： ${e.feature.properties['id']}`];
          this.switchToSpecificLine(e.feature.properties['id']);
          this.notificationService.template(this.template!, {
            nzData: info,
            nzKey: 'key',
            nzDuration: 0
          });
        });
        scene.addLayer(lineLayer);
        this.specificLineLayer$.next(lineLayer);
        this.specificLineLayer$.complete();
      });
    });
  }

  addStartMarkers() {
    forkJoin([this.scene$, this.previewFeatures$, this.specificFeatures$])
      .pipe(
        map(([scene, previewFeatures, specificFeatures]) => {
          return { scene: scene, previewFeatures: previewFeatures, specificFeatures: specificFeatures };
        })
      )
      .subscribe(args => {
        const previewCoordinates = args.previewFeatures['features'][0]['geometry']['coordinates'];

        const marker1 = new Marker().setLnglat(previewCoordinates[0]);
        const marker2 = new Marker().setLnglat(previewCoordinates[previewCoordinates.length - 1]);

        marker1.on('click', () => {
          this.switchToLaneLine('front');
        });
        marker2.on('click', () => {
          this.switchToLaneLine('back');
        });
        args.scene.addMarker(marker1);
        args.scene.addMarker(marker2);
      });
  }

  startWork() {}

  httpInit() {
    this.dataService.getData(1).subscribe((features: any) => {
      this.previewFeatures$.next(features);
      this.previewFeatures$.complete();
    });
    this.dataService.getFeatures().subscribe((features: any) => {
      this.specificFeatures$.next(features);
      this.specificFeatures$.complete();
    });
  }

  ngAfterViewInit() {
    this.httpInit();

    this.addScene();

    this.addPreviewRoadLineLayer();
    this.addStartMarkers();
    this.addSpecificRoadLineLayer();
  }
}
