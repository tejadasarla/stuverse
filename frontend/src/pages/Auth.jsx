import { useState } from "react";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { auth } from "../firebase"; // adjust path if needed
import "./style.css"; // your existing CSS

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [signInData, setSignInData] = useState({
    username: "",
    password: "",
  });

  const toggle = () => setIsSignIn(!isSignIn);

  // SIGN UP
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        signUpData.email,
        signUpData.password
      );
      alert("Account created successfully!");
      setIsSignIn(true);
    } catch (error) {
      alert(error.message);
    }
  };

  // SIGN IN
  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        signInData.username,
        signInData.password
      );
      alert("Logged in successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div id="container" className={`container ${isSignIn ? "sign-in" : "sign-up"}`}>
      <div className="row">

        {/* SIGN UP */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <form className="form sign-up" onSubmit={handleSignUp}>

              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, username: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <i className="bx bx-mail-send"></i>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, email: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, password: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  placeholder="Confirm password"
                  required
                  onChange={(e) =>
                    setSignUpData({
                      ...signUpData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <button className="btn">Sign up</button>

              <p>
                <span>Already have an account?</span>
                <b onClick={toggle} className="pointer">
                  Sign in here
                </b>
              </p>
            </form>
          </div>
        </div>

        {/* SIGN IN */}
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <form className="form sign-in" onSubmit={handleSignIn}>

              <div className="input-group">
                <i className="bx bxs-user"></i>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  onChange={(e) =>
                    setSignInData({ ...signInData, username: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <i className="bx bxs-lock-alt"></i>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  onChange={(e) =>
                    setSignInData({ ...signInData, password: e.target.value })
                  }
                />
              </div>

              <button className="btn">Sign in</button>

              <p><b>Forgot password?</b></p>
              <p>
                <span>Don't have an account?</span>
                <b onClick={toggle} className="pointer">
                  Sign up here
                </b>
              </p>
            </form>
          </div>
        </div>

      </div>

      {/* CONTENT SECTION */}
      <div className="row content-row">
        <div className="col align-items-center flex-col">
          <div className="text sign-in">
            <h2>Welcome</h2>
            <p>Sign in to continue</p>
          </div>
          <div className="img sign-in"></div>
        </div>

        <div className="col align-items-center flex-col">
          <div className="img sign-up"></div>
          <div className="text sign-up">
            <h2>Join with us</h2>
            <p>Create your account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
