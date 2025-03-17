import { Component, type OnInit, inject } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder)
  loginForm: FormGroup

  constructor() {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    })
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log("Form submitted", this.loginForm.value)
      // Aquí iría la lógica de autenticación
    }
  }

  loginWithGoogle(): void {
    console.log("Login with Google")
    // Implementar autenticación con Google
  }

  loginWithFacebook(): void {
    console.log("Login with Facebook")
    // Implementar autenticación con Facebook
  }

  forgotPassword(): void {
    console.log("Forgot password")
    // Implementar recuperación de contraseña
  }


  login = "";
  email = "";
  password = "";
  error = "";
  thereIsData = false;
  
  loginApi() {
    let url = 'http://localhost:8080/auth/login'; 
  
    // Datos que vamos a enviar al servidor
    const data = {
      email: this.email,
      password: this.password
    };
  
    // Usamos fetch con método POST
    fetch(url, {
      method: 'POST', // Indicamos que es una solicitud POST
      headers: {
        'Content-Type': 'application/json', // Aseguramos que el cuerpo de la solicitud es JSON
      },
      body: JSON.stringify(data), // Convertimos los datos a formato JSON
    })
    .then((response) => {
      if (response.ok) {
        return response.json(); // Si la respuesta es exitosa, convertimos la respuesta a JSON
      } else {
        throw new Error("Usuario no encontrado o credenciales incorrectas"); // Si la respuesta no es OK, lanzamos un error
      }
    })
    .then((datos) => {
      // Verificamos si los datos obtenidos del servidor son correctos
      if (datos.login === this.email) {
        this.login = datos.login;
        this.password = datos.password; // Aunque no es buena práctica almacenar la contraseña en el frontend
        this.thereIsData = true;
      } else {
        throw new Error("No hay coincidencia con los datos proporcionados"); // En caso de que no coincidan
      }
    })
    .catch((error) => {
      this.error = error.message; // Capturamos el error y lo mostramos
      this.thereIsData = false; 
    });
  }
  
}