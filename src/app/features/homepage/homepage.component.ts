import { Component, OnInit } from '@angular/core';
import { BannerComponent } from "../../shared/components/banner/banner.component";
import { CommonModule } from '@angular/common';
import { DriversService } from '@features/drivers/services/drivers.service';
import { BusesService } from '@features/buses/services/buses.service';
import { RoutesService } from '@features/frequencies/services/frequencies.service';
import { LoginService } from '@core/login/services/login.service';
import { forkJoin } from 'rxjs';
import { Chart } from 'chart.js/auto';

interface DashboardStats {
  totalDrivers: number;
  totalBuses: number;
  totalFrequencies: number;
  frequencyStatus: {
    active: number;
    inactive: number;
    pending: number;
  };
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [BannerComponent, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  protected stats: DashboardStats = {
    totalDrivers: 0,
    totalBuses: 0,
    totalFrequencies: 0,
    frequencyStatus: {
      active: 0,
      inactive: 0,
      pending: 0
    }
  };

  private frequencyChart: Chart | null = null;

  constructor(
    private driversService: DriversService,
    private busesService: BusesService,
    private routesService: RoutesService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    const cooperative = this.loginService.getCooperativeFromLocalStorage();
    if (!cooperative?.id) {
      console.error('No cooperative ID found');
      return;
    }

    forkJoin({
      drivers: this.driversService.getAllUsers(cooperative.id),
      buses: this.busesService.getBuses(),
      frequencies: this.routesService.getAllFrequencies()
    }).subscribe({
      next: (data) => {
        // console.log('Frequencies data:', data.frequencies);
        this.stats.totalDrivers = data.drivers.length;
        this.stats.totalBuses = data.buses.length;
        this.stats.totalFrequencies = data.frequencies.length;
        
        // Calcular estados de frecuencias
        this.stats.frequencyStatus = {
          active: data.frequencies.filter(f => f.status.toLowerCase() === 'activo').length,
          inactive: data.frequencies.filter(f => f.status.toLowerCase() === 'inactivo').length,
          pending: data.frequencies.filter(f => f.status.toLowerCase() === 'pendiente').length
        };

        this.initializeCharts();
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }

  private initializeCharts(): void {
    const ctx = document.getElementById('frequencyStatusChart') as HTMLCanvasElement;
    if (ctx) {
      this.frequencyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Activas', 'Inactivas', 'Pendientes'],
          datasets: [{
            data: [
              this.stats.frequencyStatus.active,
              this.stats.frequencyStatus.inactive,
              this.stats.frequencyStatus.pending
            ],
            backgroundColor: [
              'rgb(40, 167, 69)',  // Verde para activas
              'rgb(220, 53, 69)',  // Rojo para inactivas
              'rgb(255, 193, 7)'   // Amarillo para pendientes
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }
}
