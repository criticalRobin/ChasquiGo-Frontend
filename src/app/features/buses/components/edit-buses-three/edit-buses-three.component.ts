import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IBuses, IBusSeat } from '../../models/buses.interface';
import { BusesService } from '../../services/buses.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { AlertType } from '../../../../utils/enums/alert-type.enum';

interface SeatUserData {
  seatNumber: string;
  type: 'NORMAL' | 'VIP';
  location: 'ventana' | 'pasillo' | 'other';
  floor: number;
}

@Component({
  selector: 'app-edit-buses-three',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-buses-three.component.html',
})
export class EditBusesThreeComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('busContainer') busContainer!: ElementRef;
  @Input() bus!: IBuses;
  @Output() seatsConfigured = new EventEmitter<IBuses>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private busObject!: THREE.Group;
  private seatObjects: Map<string, THREE.Group> = new Map();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  selectedSeatType: 'NORMAL' | 'VIP' = 'NORMAL';
  selectedSeat: IBusSeat | null = null;

  constructor(
    private busesService: BusesService,
    private loadingService: LoadingService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('EditBusesThreeComponent initialized with bus:', this.bus);
  }

  ngAfterViewInit(): void {
    console.log('AfterViewInit - Bus data:', this.bus);
    if (this.busContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (entry.target === this.busContainer.nativeElement) {
            const { width, height } = entry.contentRect;
            console.log('Container dimensions:', width, height);
            if (width > 0 && height > 0) {
              if (this.resizeObserver) {
                this.resizeObserver.unobserve(this.busContainer.nativeElement);
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
              }
              this.initializeScene();
            }
          }
        }
      });
      this.resizeObserver.observe(this.busContainer.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges triggered:', changes);
    if (changes['bus'] && this.bus) {
      console.log('Bus data changed:', this.bus);
      if (!changes['bus'].firstChange) {
        this.cleanUpThreeJS();
      }
      if (this.busContainer?.nativeElement) {
        this.initializeScene();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('click', this.onMouseClick.bind(this));
      this.renderer.dispose();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.scene = null as any;
    this.camera = null as any;
    this.renderer = null as any;
    this.controls = null as any;
    this.busObject = null as any;
    this.seatObjects.clear();
    this.animationFrameId = null;
    this.resizeObserver = null;

    // Call cleanUpThreeJS as well for thorough cleanup
    this.cleanUpThreeJS();
  }

  private initializeScene(): void {
    console.log('initializeScene: Starting process.');
    console.log('initializeScene: Current bus data:', this.bus);
    if (!this.busContainer?.nativeElement) {
      console.error('initializeScene: Bus container element not found!');
      return;
    }

    const container = this.busContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    console.log(`initializeScene: Container dimensions: ${width}x${height}`);

    if (width === 0 || height === 0) {
      console.warn('initializeScene: Container has zero dimensions. Skipping initialization.');
      return;
    }

    if (!this.bus) {
      console.warn('initializeScene: Bus data is not available. Cannot proceed with scene initialization.');
      return;
    }

    console.log('initializeScene: Calling initThreeJS().');
    this.initThreeJS();
    console.log('initializeScene: Calling createBus().');
    this.createBus();

    if (!this.animationFrameId) {
      console.log('initializeScene: Starting animation loop.');
      this.animate();
    }
    console.log('initializeScene: Process completed.');
  }

  private initThreeJS(): void {
    console.log('initThreeJS: Starting process.');
    const container = this.busContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Limpiar escena existente si hay una
    if (this.scene) {
      console.log('initThreeJS: Cleaning up existing Three.js scene.');
      this.cleanUpThreeJS();
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    console.log('initThreeJS: Scene created.');

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    console.log('initThreeJS: Camera created and positioned.');

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    console.log('initThreeJS: Renderer created, sized, and appended to container.');
    console.log('initThreeJS: Renderer DOM element clientWidth:', this.renderer.domElement.clientWidth);
    console.log('initThreeJS: Renderer DOM element clientHeight:', this.renderer.domElement.clientHeight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    console.log('initThreeJS: OrbitControls set up.');

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    console.log('initThreeJS: Ambient light added.');

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    console.log('initThreeJS: Directional light added.');

    // Agregar el event listener para el clic
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    console.log('initThreeJS: Click event listener added.');
    console.log('initThreeJS: Process completed.');
  }

  private createBus(): void {
    console.log('createBus: Starting process.');
    console.log('createBus: Bus data received:', this.bus);
    if (!this.bus) {
      console.error('createBus: Cannot create bus: bus data is undefined.');
      return;
    }

    this.busObject = new THREE.Group();
    this.seatObjects.clear();
    console.log('createBus: Bus group and seat objects cleared.');

    const busWidth = 3.5;
    const busLength = (this.bus?.capacity ?? 0) > 30 ? 12 : 9;
    const busHeight = 2.8;
    const hasSecondFloor = this.bus.floorCount === 2;
    console.log(`createBus: Bus dimensions - Width: ${busWidth}, Length: ${busLength}, Height: ${busHeight}. Has second floor: ${hasSecondFloor}`);

    // Primer piso
    const firstFloorGeometry = new THREE.BoxGeometry(busWidth, busHeight, busLength);
    const firstFloorMaterial = new THREE.MeshLambertMaterial({
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.3
    });
    const firstFloorMesh = new THREE.Mesh(firstFloorGeometry, firstFloorMaterial);
    firstFloorMesh.position.y = busHeight / 2;
    firstFloorMesh.castShadow = true;
    firstFloorMesh.receiveShadow = true;
    this.busObject.add(firstFloorMesh);
    console.log('createBus: First floor mesh added.');

    // Crear asientos para el primer piso
    this.createSeatsForFloor(1);

    if (hasSecondFloor) {
      // Segundo piso
      const secondFloorGeometry = new THREE.BoxGeometry(busWidth, busHeight, busLength);
      const secondFloorMesh = new THREE.Mesh(secondFloorGeometry, firstFloorMaterial);
      secondFloorMesh.position.y = busHeight * 1.5;
      secondFloorMesh.castShadow = true;
      secondFloorMesh.receiveShadow = true;
      this.busObject.add(secondFloorMesh);
      console.log('createBus: Second floor mesh added.');

      // Crear asientos para el segundo piso
      this.createSeatsForFloor(2);

      // Agregar escaleras
      this.createStairsBetweenFloors(busWidth, busHeight, busLength);
      console.log('createBus: Stairs added.');
    }

    // Agregar ruedas
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Posiciones de las ruedas
    const wheelPositions = [
      { x: -busWidth/2 - 0.2, y: 0.4, z: -busLength/3 },
      { x: busWidth/2 + 0.2, y: 0.4, z: -busLength/3 },
      { x: -busWidth/2 - 0.2, y: 0.4, z: busLength/3 },
      { x: busWidth/2 + 0.2, y: 0.4, z: busLength/3 }
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      this.busObject.add(wheel);
    });
    console.log('createBus: Wheels added.');

    this.scene.add(this.busObject);
    console.log('createBus: Bus object added to scene.');

    // Agregar plano de suelo
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    console.log('createBus: Ground plane added to scene.');

    // Forzar renderizado inicial
    this.renderer.render(this.scene, this.camera);
    console.log('createBus: Initial render forced.');
    console.log('createBus: Process completed.');
  }

  private createSeatsForFloor(floor: number): void {
    console.log(`createSeatsForFloor: Starting for floor ${floor}.`);
    if (!this.bus?.seats) {
      console.warn('createSeatsForFloor: No seats data available. Skipping seat creation.');
      return;
    }

    const floorSeats = this.bus.seats.filter(seat => seat.floor === floor);
    console.log(`createSeatsForFloor: Found ${floorSeats.length} seats for floor ${floor}.`)

    const seatsPerRow = 4;
    const xSpacing = 1.2;
    const zSpacing = 1.2;
    const startX = -(seatsPerRow - 1) * xSpacing / 2;
    const yOffset = floor === 2 ? 2.8 : 0;
    console.log(`createSeatsForFloor: Seat layout parameters - seatsPerRow: ${seatsPerRow}, xSpacing: ${xSpacing}, zSpacing: ${zSpacing}, startX: ${startX}, yOffset: ${yOffset}`);

    floorSeats.forEach((seat: IBusSeat) => {
      const seatGroup = new THREE.Group();
      
      // Crear el asiento
      const seatGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
      const seatMaterial = new THREE.MeshLambertMaterial({
        color: seat.type === 'VIP' ? 0xe74c3c : 0x4caf50
      });
      const seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
      seatMesh.position.y = 0.05;
      seatMesh.castShadow = true;
      seatMesh.receiveShadow = true;
      seatGroup.add(seatMesh);

      // Crear el respaldo
      const backGeometry = new THREE.BoxGeometry(0.9, 0.8, 0.1);
      const backMesh = new THREE.Mesh(backGeometry, seatMaterial);
      backMesh.position.z = -0.45;
      backMesh.position.y = 0.45;
      backMesh.castShadow = true;
      backMesh.receiveShadow = true;
      seatGroup.add(backMesh);

      // Calcular la posición del asiento
      const seatNumber = parseInt(seat.number);
      const row = Math.floor((seatNumber - 1) / seatsPerRow);
      const col = (seatNumber - 1) % seatsPerRow;

      seatGroup.position.set(
        startX + col * xSpacing,
        yOffset,
        row * -zSpacing
      );

      // Guardar la información del asiento
      seatGroup.userData = {
        seatNumber: seat.number,
        type: seat.type,
        location: seat.location,
        floor: seat.floor
      };

      this.seatObjects.set(seat.number, seatGroup);
      this.busObject.add(seatGroup);
      console.log(`createSeatsForFloor: Seat ${seat.number} (${seat.type}) created for floor ${seat.floor} at position (${seatGroup.position.x.toFixed(2)}, ${seatGroup.position.y.toFixed(2)}, ${seatGroup.position.z.toFixed(2)})`);
    });
    console.log(`createSeatsForFloor: Completed for floor ${floor}. Total seats added: ${floorSeats.length}`);
  }

  private createStairsBetweenFloors(busWidth: number, busHeight: number, busLength: number): void {
    const stairsGroup = new THREE.Group();
    const stepCount = 5;
    const stepWidth = 1.0;
    const stepDepth = 0.3;
    const stepHeight = 0.2;
    const stairsMaterial = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });

    // Crear los escalones
    for (let i = 0; i < stepCount; i++) {
      const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const step = new THREE.Mesh(stepGeometry, stairsMaterial);
      step.position.set(
        0,
        busHeight + (i * stepHeight),
        -busLength/2 + (i * stepDepth)
      );
      step.castShadow = true;
      step.receiveShadow = true;
      stairsGroup.add(step);
    }

    // Agregar paredes laterales
    const wallGeometry = new THREE.BoxGeometry(0.1, busHeight, busLength/2);
    const leftWall = new THREE.Mesh(wallGeometry, stairsMaterial);
    leftWall.position.set(-stepWidth/2, busHeight + (stepCount * stepHeight)/2, -busLength/2 + (stepCount * stepDepth)/2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    stairsGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeometry, stairsMaterial);
    rightWall.position.set(stepWidth/2, busHeight + (stepCount * stepHeight)/2, -busLength/2 + (stepCount * stepDepth)/2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    stairsGroup.add(rightWall);

    this.busObject.add(stairsGroup);
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.busObject.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const seatGroup = clickedObject.parent; 
      
      if (seatGroup && seatGroup.userData && 'seatNumber' in seatGroup.userData) {
        const seatNumber = seatGroup.userData['seatNumber'];
        const currentSeat = this.bus.seats.find(s => s.number === seatNumber);
        
        if (currentSeat) {
          this.selectedSeat = currentSeat;
          // Toggle seat type
          this.selectedSeatType = currentSeat.type === 'NORMAL' ? 'VIP' : 'NORMAL';
          currentSeat.type = this.selectedSeatType;
          
          // Update seat color
          const seatMesh = seatGroup.children[0] as THREE.Mesh;
          if (seatMesh.material instanceof THREE.MeshLambertMaterial) {
            seatMesh.material.color.set(this.selectedSeatType === 'VIP' ? 0xe74c3c : 0x4caf50);
          }
          
          // Update back color
          const backMesh = seatGroup.children[1] as THREE.Mesh;
          if (backMesh.material instanceof THREE.MeshLambertMaterial) {
            backMesh.material.color.set(this.selectedSeatType === 'VIP' ? 0xe74c3c : 0x4caf50);
          }
          
          // Emit updated bus object with seats
          this.seatsConfigured.emit(this.bus);
        }
      }
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const container = this.busContainer.nativeElement;
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    }
  }

  private cleanUpThreeJS(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.scene) {
      this.scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(material => material.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      this.scene = null as any;
    }
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('click', this.onMouseClick.bind(this));
      this.renderer.domElement.remove();
      this.renderer.dispose();
      (this.renderer as any) = null;
    }
    if (this.controls) {
      this.controls.dispose();
      (this.controls as any) = null;
    }
    this.busObject = null as any;
    this.seatObjects.clear();
  }

  // Method to manually update seat type (e.g., from a UI dropdown)
  public updateSelectedSeatType(type: 'NORMAL' | 'VIP'): void {
    this.selectedSeatType = type;
    if (this.selectedSeat) {
      const seatGroup = this.seatObjects.get(this.selectedSeat.number);
      if (seatGroup) {
        const seatMesh = seatGroup.children[0] as THREE.Mesh;
        if (seatMesh.material instanceof THREE.MeshLambertMaterial) {
          seatMesh.material.color.set(this.selectedSeatType === 'VIP' ? 0xe74c3c : 0x4caf50);
        }
        const backMesh = seatGroup.children[1] as THREE.Mesh;
        if (backMesh.material instanceof THREE.MeshLambertMaterial) {
          backMesh.material.color.set(this.selectedSeatType === 'VIP' ? 0xe74c3c : 0x4caf50);
        }
        // Update the actual seat data in the bus object
        const seatToUpdate = this.bus.seats.find(s => s.number === this.selectedSeat!.number);
        if (seatToUpdate) {
          seatToUpdate.type = type;
        }
        this.seatsConfigured.emit(this.bus);
      }
    }
  }

  // This method will be called from the parent component when the save button is clicked
  saveConfiguration(): void {
    // The seats array in this.bus is already updated on each click, 
    // so we just need to emit the bus object.
    this.seatsConfigured.emit(this.bus);
  }

  // Add getSeatColor method
  private getSeatColor(type: string): number {
    switch (type) {
      case 'NORMAL':
        return 0x4caf50; // Green
      case 'VIP':
        return 0xe74c3c; // Red
      default:
        return 0xcccccc; // Grey for unknown
    }
  }

  cancel(): void {
    this.router.navigate(['/buses']);
  }
} 