import { Modal, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

function LoginModal({ show, onHide, onSwitchToSignup }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login(identifier, password);
    if (!res.ok) {
      alert(res.message || 'Login failed');
      return;
    }
    // Login สำเร็จ -> ปิด modal และไปหน้า my profile
    window.dispatchEvent(new Event('authChange'));
    if (onHide) onHide();
    navigate('/my-profile');
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body style={{ padding: '40px 30px' }}>
        <div className="text-center mb-4">
          <Button
            variant="dark"
            size="lg"
            style={{ width: '200px', borderRadius: '8px' }}
            onClick={onSwitchToSignup}
          >
            Create Account
          </Button>
        </div>

        <h4 className="text-center fw-bold mb-4">Login</h4>

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={{
                backgroundColor: '#e8f0fe',
                border: 'none',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: '#e8f0fe',
                border: 'none',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
          </Form.Group>

          <Button
            variant="secondary"
            type="submit"
            style={{
              width: '100%',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: '600',
              backgroundColor: '#6c757d',
              border: 'none'
            }}
          >
            Login
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default LoginModal;
