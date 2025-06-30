import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ICoopResponse } from '../../models/coop-response.interface';
import { ICoopRequest } from '../../models/coop-request.interface';
import { HttpClient } from '@angular/common/http';

interface IUploadResponse {
  url: string;
}

@Component({
  selector: 'app-coop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coop-form.component.html',
  styleUrl: './coop-form.component.css',
})
export class CoopFormComponent implements OnInit {
  @Input() cooperative: ICoopResponse | null = null;
  @Output() formSubmit = new EventEmitter<ICoopRequest>();
  @Output() cancelEdit = new EventEmitter<void>();

  protected coopForm: FormGroup;
  protected selectedFile: File | null = null;
  protected uploadedLogoUrl: string | null = null;

  private readonly http: HttpClient = inject(HttpClient);

  constructor(private fb: FormBuilder) {
    this.coopForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      logo: [''],
      facebook: [''],
      instagram: [''],
      X: [''],
      website: [''],
    });
  }

  ngOnInit(): void {
    if (this.cooperative) {
      this.coopForm.patchValue({
        name: this.cooperative.name,
        address: this.cooperative.address,
        phone: this.cooperative.phone,
        email: this.cooperative.email,
        logo: this.cooperative.logo,
        facebook: this.cooperative.facebook,
        instagram: this.cooperative.instagram,
        X: this.cooperative.X,
        website: this.cooperative.website,
      });
      this.uploadedLogoUrl = this.cooperative.logo;
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.handleFileUpload(this.selectedFile);
    }
  }

  private handleFileUpload(file: File): void {
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = 'http://45.14.225.213:3000/cloudinary/image';

    this.http.post<IUploadResponse>(uploadUrl, formData).subscribe({
      next: (response) => {
        this.uploadedLogoUrl = response.url;
        this.coopForm.patchValue({ logo: response.url });
        console.log('Image uploaded, URL:', response.url);
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.selectedFile = null;
      },
    });
  }

  protected onSubmit(): void {
    if (this.coopForm.valid) {
      const coopData: ICoopRequest = {
        ...this.coopForm.value,
        logo: this.uploadedLogoUrl || '',
      };
      this.formSubmit.emit(coopData);
    }
  }

  protected onCancel(): void {
    this.cancelEdit.emit();
    if (this.cooperative) {
      this.coopForm.patchValue({
        name: this.cooperative.name,
        address: this.cooperative.address,
        phone: this.cooperative.phone,
        email: this.cooperative.email,
        logo: this.cooperative.logo,
        facebook: this.cooperative.facebook,
        instagram: this.cooperative.instagram,
        X: this.cooperative.X,
        website: this.cooperative.website,
      });
      this.uploadedLogoUrl = this.cooperative.logo;
    }
  }
}
