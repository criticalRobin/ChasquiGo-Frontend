import { Component, OnInit, OnDestroy, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerComponent } from "../../shared/components/banner/banner.component";
import { BusesService } from '@features/buses/services/buses.service';
import { BusTypesService } from '@features/bus-types/services/bus-types.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { RouteSheetService } from '@features/route-sheets/services/route-sheet.service';
import { LoginService } from '@core/login/services/login.service';
import { forkJoin, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

interface DashboardStats {
  totalBuses: number;
  totalRoutes: number;
  totalFrequencies: number;
  totalBusTypes: number;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, BannerComponent],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('statsChart', { static: false }) statsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('busTypesChart', { static: false }) busTypesChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly busesService = inject(BusesService);
  private readonly busTypesService = inject(BusTypesService);
  private readonly routesService = inject(RoutesService);
  private readonly routeSheetService = inject(RouteSheetService);
  private readonly loginService = inject(LoginService);

  stats: DashboardStats = {
    totalBuses: 0,
    totalRoutes: 0,
    totalFrequencies: 0,
    totalBusTypes: 0
  };

  busTypeStats: Array<{ name: string; count: number }> = [];
  
  private subscriptions = new Subscription();
  private statsChart?: Chart;
  private busTypesChart?: Chart;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.statsChart) {
      this.statsChart.destroy();
    }
    if (this.busTypesChart) {
      this.busTypesChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (!cooperative?.id) {
      this.error = 'No se encontró información de la cooperativa';
      this.isLoading = false;
      return;
    }

    const requests = forkJoin({
      buses: this.busesService.getBusesByCooperativeId(cooperative.id),
      busTypes: this.busTypesService.getBusTypes(),
      frequencies: this.routesService.getAllFrequencies(),
      routeSheets: this.routeSheetService.getAllRouteSheets()
    });

    this.subscriptions.add(
      requests.subscribe({
        next: (data) => {
          this.processStatsData(data);
          this.isLoading = false;
          // Crear gráficos después de que la vista esté inicializada y los datos estén cargados
          setTimeout(() => this.createCharts(), 100);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Error al cargar los datos del dashboard';
          this.isLoading = false;
        }
      })
    );
  }

  private processStatsData(data: any): void {
    // Filtrar buses activos (no eliminados)
    const activeBuses = data.buses.filter((bus: any) => !bus.isDeleted);
    
    // Filtrar tipos de bus activos
    const activeBusTypes = data.busTypes.filter((type: any) => !type.isDeleted);
    
    this.stats = {
      totalBuses: activeBuses.length,
      totalRoutes: data.routeSheets.length,
      totalFrequencies: data.frequencies.length,
      totalBusTypes: activeBusTypes.length
    };

    // Procesar estadísticas de tipos de bus
    const busTypeCount = new Map<string, number>();
    
    activeBuses.forEach((bus: any) => {
      const busType = activeBusTypes.find((type: any) => type.id === bus.busTypeId);
      if (busType) {
        const typeName = busType.name;
        busTypeCount.set(typeName, (busTypeCount.get(typeName) || 0) + 1);
      }
    });

    this.busTypeStats = Array.from(busTypeCount.entries()).map(([name, count]) => ({ name, count }));
  }

  private createCharts(): void {
    if (this.statsChartRef && this.busTypesChartRef) {
      this.createStatsChart();
      this.createBusTypesChart();
    }
  }

  private createStatsChart(): void {
    const ctx = this.statsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.statsChart) {
      this.statsChart.destroy();
    }

    this.statsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Buses', 'Rutas', 'Frecuencias', 'Tipos de Bus'],
        datasets: [{
          label: 'Cantidad',
          data: [
            this.stats.totalBuses,
            this.stats.totalRoutes,
            this.stats.totalFrequencies,
            this.stats.totalBusTypes
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Estadísticas Generales'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private createBusTypesChart(): void {
    const ctx = this.busTypesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.busTypesChart) {
      this.busTypesChart.destroy();
    }

    if (this.busTypeStats.length === 0) {
      return;
    }

    this.busTypesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.busTypeStats.map(stat => stat.name),
        datasets: [{
          data: this.busTypeStats.map(stat => stat.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución por Tipo de Bus'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
