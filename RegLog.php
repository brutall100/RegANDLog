<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="http://localhost/aldas/Viktorina.live/d_regilogi.css" />

  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

  <title>Registracija ir Prisijungimas kartu viename puslapyje </title>

</head>

<body>
  <header></header>

  <div>
    <p>Registracija ir prisijungimas</p>
  </div>

  <div class="container" id="container">
    <!-- Registracija -->
    <div class="sign-up-container">
      <form method="POST" action="http://localhost:4000/register" id="register-form">
        <h1>Registracija</h1>
    </div>

    <div class="form-group">
      <input type="text" placeholder="Vardas" id="name-input" name="nick_name" required />
      <span id="name-error"></span>
    </div>
    <div class="form-group">
      <input type="email" placeholder="@" id="user-email" name="user_email" required />
      <span id="email-error"></span>
    </div>
    <div class="form-group">
      <input type="password" placeholder="Slaptažodis" id="password-input" name="user_password" required />
      <span id="password-error"></span>
    </div>
    <button type="submit" name="submitBtnReg" value="Reginam" id="submitButtonReg">Register</button>
    </form>

    <!-- Prisijungimas -->
    <div class="sign-in-container">
      <form method="POST" action="http://localhost:4000/login">
        <h1>Prisijungti</h1>

        <input type="text" placeholder="Name" name="nick_name" required />
        <input type="password" placeholder="Password" name="user_password" required />
        <a href="#">Forgot your password?</a>
        <button type="submit" name="submitBtnLog" value="Loginam" id="submitButtonLog">Login</button>
      </form>

    </div>

  </div>

  <script src="http://localhost/aldas/Viktorina.live/d_regilogi.js"></script>

  <footer></footer>
</body>

</html>