import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../services/user-service/user.service';

@Component({
  selector: 'app-navigation-profile',
  templateUrl: './navigation-profile.component.html',
  styleUrls: ['./navigation-profile.component.css']
})
export class NavigationProfileComponent implements OnInit {
  userProfile: any = {}; // Datos del perfil del usuario
  userEmail: string | null = null; // Email del usuario que se está visualizando

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    // Obtener el email del usuario desde la URL
    this.userEmail = this.route.snapshot.paramMap.get('userEmail');
    if (this.userEmail) {
      this.loadUserProfile(this.userEmail);
    }
  }

  loadUserProfile(email: string): void {
    // Usar el servicio para obtener los datos del perfil
    this.userService.getOtherUserProfile(email).subscribe({
      next: (data: any) => {
        this.userProfile = data;
      },
      error: (err) => {
        console.error('Error al cargar el perfil del usuario:', err);
      }
    });
  }
}