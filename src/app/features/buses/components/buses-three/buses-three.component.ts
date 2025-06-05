import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IBuses, IBusSeat } from '../../models/buses.interface';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';

@Component({
  selector: 'app-buses-three',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buses-three.component.html',
  styleUrl: './buses-three.component.css'
})
export class BusesThreeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() bus!: IBuses;
  @Input() editable: boolean = true;
  @ViewChild('busContainer', { static: true }) busContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private seats: THREE.Mesh[] = [];
  private busBody!: THREE.Group;
  private busFloor1!: THREE.Group;
  private busFloor2!: THREE.Group;
  private seatObjects: { [key: string]: { mesh: THREE.Mesh, data: IBusSeat } } = {};

  viewMode: '3d' | 'top' = '3d';
  selectedSeatType: 'normal' | 'vip' | 'preferential' = 'normal';
  private currentSeatNumber = 1;
  private destroy$ = new Subject<void>();

  constructor() {}
  ngOnInit(): void {
    // Initialize the 3D scene
    this.initThreeJS();
    this.setupLighting();
    
    // Only create the bus if the bus data is available
    if (this.bus) {
      this.createBus();
    } else {
      console.warn('Bus data not provided to the BusesThreeComponent');
    }
    
    this.animate();

    // Listen for window resize events
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bus'] && !changes['bus'].firstChange) {
      this.updateBusLayout();
    }

    if (changes['viewMode']) {
      this.updateCameraPosition();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup event listeners and Three.js resources
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    this.renderer.dispose();
    this.controls.dispose();

    // Dispose all geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
  }  private initThreeJS(): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    const container = this.busContainer.nativeElement;
    
    // Check if the container is properly initialized
    if (!container) {
      console.error('Bus container element not found!');
      return;
    }
    
    // Set dimensions, ensuring valid non-zero sizes
    const width = container.clientWidth || 800;  // Fallback width
    const height = container.clientHeight || 500; // Fallback height
    
    console.log('Initializing Three.js canvas with size:', width, 'x', height);
    
    // Create camera with proper aspect ratio
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 10, 20);
    
    // Create renderer with antialiasing for smoother edges
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear the container and append the renderer
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(this.renderer.domElement);
    
    // Add orbit controls for mouse interaction
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
  }
  private createBus(): void {
    if (!this.bus) {
      console.error('Cannot create bus: bus data is undefined');
      return;
    }

    console.log('Creating 3D bus with data:', this.bus);
    
    // Create bus group
    this.busBody = new THREE.Group();
    this.busFloor1 = new THREE.Group();
    this.busBody.add(this.busFloor1);

    // Bus dimensions
    const busWidth = 2.5;
    const busLength = this.bus.capacity > 30 ? 12 : 9; // Adjust length based on capacity
    const busHeight = 2.8;
    
    // Create the bus base/chassis
    const busGeometry = new THREE.BoxGeometry(busWidth, busHeight, busLength);
    const busMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c3e50, 
      transparent: true,
      opacity: 0.3
    });
    const busChasis = new THREE.Mesh(busGeometry, busMaterial);
    busChasis.position.y = busHeight / 2;
    busChasis.castShadow = true;
    busChasis.receiveShadow = true;
    this.busFloor1.add(busChasis);

    // Create wheels
    this.addWheels(busWidth, busLength);

    // Create seats based on capacity
    this.createSeats();

    // If two floors, create the second floor
    if (this.bus.floorCount === 2) {
      this.busFloor2 = new THREE.Group();
      this.busFloor2.position.y = busHeight;
      this.busBody.add(this.busFloor2);

      // Second floor chassis
      const floor2Geometry = new THREE.BoxGeometry(busWidth, busHeight, busLength);
      const floor2Mesh = new THREE.Mesh(floor2Geometry, busMaterial);
      floor2Mesh.position.y = busHeight / 2;
      floor2Mesh.castShadow = true;
      floor2Mesh.receiveShadow = true;
      this.busFloor2.add(floor2Mesh);

      // Create second floor seats
      this.createSeats(true);
    }

    this.scene.add(this.busBody);

    // Add a floor/ground
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Position camera to view the bus
    this.resetView();
  }

  private addWheels(busWidth: number, busLength: number): void {
    const wheelRadius = 0.5;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.4, 32);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-busWidth / 2 - 0.2, wheelRadius, busLength / 2 - 1);
    this.busBody.add(frontLeftWheel);

    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(busWidth / 2 + 0.2, wheelRadius, busLength / 2 - 1);
    this.busBody.add(frontRightWheel);

    // Rear wheels
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(-busWidth / 2 - 0.2, wheelRadius, -busLength / 2 + 1);
    this.busBody.add(rearLeftWheel);

    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(busWidth / 2 + 0.2, wheelRadius, -busLength / 2 + 1);
    this.busBody.add(rearRightWheel);
  }

  private createSeats(isSecondFloor: boolean = false): void {
    const busWidth = 2.5;
    const busLength = this.bus.capacity > 30 ? 12 : 9;
    const floorGroup = isSecondFloor ? this.busFloor2 : this.busFloor1;
    
    // Determine how many seats to create on this floor
    const totalCapacity = this.bus.capacity;
    let floorCapacity: number;
    
    if (this.bus.floorCount === 2) {
      // Split seats between floors
      floorCapacity = isSecondFloor ? Math.floor(totalCapacity / 2) : Math.ceil(totalCapacity / 2);
    } else {
      floorCapacity = totalCapacity;
    }

    // Determine rows and columns based on capacity
    // Typically buses have 2 seats on one side, aisle in middle, and 2 seats on other side
    const seatsPerRow = 4;
    const rows = Math.ceil(floorCapacity / seatsPerRow);
    
    const seatWidth = 0.45;
    const seatHeight = 0.1;
    const seatDepth = 0.45;
    const aisleWidth = 0.6;
    const rowSpacing = 0.9;
    
    // Start from the back of the bus
    let seatCount = 0;
    
    for (let row = 0; row < rows; row++) {
      const rowZ = -busLength / 2 + 1.5 + row * rowSpacing;
      
      // Create a row of seats (2 on left, 2 on right)
      for (let col = 0; col < seatsPerRow; col++) {
        if (seatCount >= floorCapacity) break;
        
        let posX: number;
        if (col < 2) {
          // Left side seats
          posX = -busWidth / 2 + 0.5 + col * seatWidth;
        } else {
          // Right side seats
          posX = aisleWidth / 2 + (col - 2) * seatWidth;
        }
        
        this.createSeat(posX, rowZ, seatWidth, seatHeight, seatDepth, floorGroup, row, col, isSecondFloor);
        seatCount++;
      }
    }
  }

  private createSeat(
    x: number, 
    z: number, 
    width: number, 
    height: number, 
    depth: number, 
    floorGroup: THREE.Group,
    row: number,
    col: number,
    isSecondFloor: boolean
  ): void {
    const busHeight = 2.8;
    const baseY = isSecondFloor ? busHeight : 0;
    const seatY = baseY + 1;  // Position seats at appropriate height
    
    // Seat base
    const seatGeometry = new THREE.BoxGeometry(width, height, depth);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x4caf50 }); // Default green
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);

    seat.position.set(x, seatY, z);
    
    // Seat back
    const backGeometry = new THREE.BoxGeometry(width, 0.5, height);
    const back = new THREE.Mesh(backGeometry, seatMaterial);
    back.position.set(0, 0.25, -depth / 2);
    seat.add(back);
    
    seat.castShadow = true;
    seat.receiveShadow = true;
    
    // Store the seat in our reference object
    const seatNumber = `${isSecondFloor ? "2" : "1"}${row + 1}${String.fromCharCode(65 + col)}`;
    
    // Create default seat data
    const seatData: IBusSeat = {
      number: seatNumber,
      type: "normal",
      location: col === 0 || col === 2 ? "ventana" : "pasillo"
    };
    
    // Add the seat to the scene
    floorGroup.add(seat);
    
    // Store reference to the seat mesh
    this.seatObjects[seatNumber] = { mesh: seat, data: seatData };
    
    // Add click event to the seat
    this.makeClickable(seat, seatData);
  }

  private makeClickable(mesh: THREE.Mesh, seatData: IBusSeat): void {
    mesh.userData['clickable'] = true;
    mesh.userData['seatData'] = seatData;
    
    // Set up raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    this.renderer.domElement.addEventListener('click', (event) => {
      if (!this.editable) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, this.camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      
      for (let i = 0; i < intersects.length; i++) {
        let object = intersects[i].object;
        
        // Traverse up to find the parent with clickable property
        while (object && !object.userData['clickable']) {
          object = object.parent as THREE.Mesh;
        }
        
        if (object && object.userData['clickable']) {
          const seatNumber = object.userData['seatData'].number;
          
          if (this.seatObjects[seatNumber]) {
            // Update seat type based on selection
            this.seatObjects[seatNumber].data.type = this.selectedSeatType;
            
            // Update seat color
            this.updateSeatColor(seatNumber);
            break;
          }
        }
      }
    });
  }

  private updateSeatColor(seatNumber: string): void {
    const seatObj = this.seatObjects[seatNumber];
    if (!seatObj) return;
    
    const seat = seatObj.mesh;
    const seatType = seatObj.data.type;
    
    let color: number;
    switch (seatType) {
      case 'normal':
        color = 0x4caf50; // Green
        break;
      case 'vip':
        color = 0xff9800; // Orange
        break;
      case 'preferential':
        color = 0x2196f3; // Blue
        break;
      default:
        color = 0x4caf50; // Default green
    }
    
    // Update the material color for the seat and its children
    if (seat.material instanceof THREE.Material) {
      (seat.material as THREE.MeshLambertMaterial).color.set(color);
    }
    
    seat.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        child.material.color.set(color);
      }
    });
  }

  updateBusLayout(): void {
    // Clear existing seats
    this.busFloor1.clear();
    if (this.busFloor2) {
      this.busFloor2.clear();
    }
    
    this.seatObjects = {};
    this.createBus();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const container = this.busContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  resetView(): void {
    if (this.viewMode === '3d') {
      this.camera.position.set(0, 10, 20);
    } else {
      this.camera.position.set(0, 20, 0);
      this.camera.lookAt(0, 0, 0);
    }
    this.controls.update();
  }

  updateCameraPosition(): void {
    if (this.viewMode === '3d') {
      gsap.to(this.camera.position, {
        x: 0,
        y: 10,
        z: 20,
        duration: 1,
        onUpdate: () => this.camera.lookAt(0, 0, 0)
      });
    } else {
      gsap.to(this.camera.position, {
        x: 0,
        y: 20,
        z: 0,
        duration: 1,
        onUpdate: () => this.camera.lookAt(0, 0, 0)
      });
    }
  }

  saveSeatsConfiguration(): void {
    // Extract all seat data
    const seats: IBusSeat[] = Object.values(this.seatObjects).map(obj => obj.data);
    
    // Update the bus object with the configured seats
    if (this.bus) {
      this.bus.seats = seats;
      console.log('Seat configuration saved:', seats);
      // Here you would typically emit an event or call a service method
      // to save the updated bus configuration
    }
  }
}
