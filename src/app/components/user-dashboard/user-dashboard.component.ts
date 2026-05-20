import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css',
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('formContainer', { read: ViewContainerRef }) formContainer!: ViewContainerRef;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  allUsers: User[] = [];
  searchQuery: string = '';
  selectedRole: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  isModalOpen: boolean = false;
  private usersSubscription?: Subscription;
  private chart: any;
  private chartInitialized: boolean = false;

  constructor(
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.usersSubscription = this.userService.users$.subscribe((users) => {
      this.allUsers = users;
      // Re-adjust page if current page exceeds bounds after updates
      const maxPage = this.totalPages;
      if (this.currentPage > maxPage && maxPage > 0) {
        this.currentPage = maxPage;
      }
      if (this.chartInitialized) {
        // Run with small delay to let canvas update
        setTimeout(() => this.initChart(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartInitialized = true;
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Filter & Search logic
  get filteredUsers(): User[] {
    return this.allUsers.filter((user) => {
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = this.selectedRole ? user.role === this.selectedRole : true;
      return matchesSearch && matchesRole;
    });
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Metrics
  getRoleCount(role: 'Admin' | 'Editor' | 'Viewer'): number {
    return this.allUsers.filter((u) => u.role === role).length;
  }

  // Dynamic Lazy Loading of User Form Modal
  async openAddUserModal(): Promise<void> {
    this.isModalOpen = true;

    // Dynamically import the UserFormComponent class
    const { UserFormComponent } = await import('../user-form/user-form.component');

    this.formContainer.clear();
    const componentRef = this.formContainer.createComponent(UserFormComponent);

    // Subscribe to component outputs
    componentRef.instance.save.subscribe((newUser: User) => {
      this.userService.addUser(newUser);
      this.closeAddUserModal();
    });

    componentRef.instance.close.subscribe(() => {
      this.closeAddUserModal();
    });
  }

  closeAddUserModal(): void {
    this.formContainer.clear();
    this.isModalOpen = false;
  }

  // Dynamic Lazy Loading of Chart.js
  private async initChart(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.chartCanvas) {
      return;
    }

    const adminCount = this.getRoleCount('Admin');
    const editorCount = this.getRoleCount('Editor');
    const viewerCount = this.getRoleCount('Viewer');

    try {
      // Dynamically import Chart.js library
      const { Chart } = await import('chart.js/auto');

      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Admin', 'Editor', 'Viewer'],
          datasets: [
            {
              data: [adminCount, editorCount, viewerCount],
              backgroundColor: [
                '#1c4980', // Admin - deep corporate blue
                '#f59e0b', // Editor - warm amber/yellow
                '#10b981', // Viewer - emerald green
              ],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  family: 'Inter',
                  size: 12,
                  weight: 500,
                },
                color: '#383838',
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize Chart.js dynamically', err);
    }
  }
}
