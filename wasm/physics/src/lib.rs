#[no_mangle]
pub extern "C" fn integrate_position(x: f32, vx: f32, dt: f32) -> f32 {
    x + vx * dt
}

#[no_mangle]
pub extern "C" fn integrate_velocity(v: f32, a: f32, dt: f32) -> f32 {
    v + a * dt
}

#[no_mangle]
pub extern "C" fn detect_collision(
    ax: f32,
    ay: f32,
    aw: f32,
    ah: f32,
    bx: f32,
    by: f32,
    bw: f32,
    bh: f32,
) -> i32 {
    let collision = ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    if collision { 1 } else { 0 }
}
