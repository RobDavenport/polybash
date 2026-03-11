use polybash_contracts::RegionDescriptor;
use polybash_ops::clamp_region;

#[test]
fn region_values_are_clamped() {
    let region = RegionDescriptor {
        id: "jaw_width".to_string(),
        min: -0.15,
        max: 0.2,
    };

    assert_eq!(clamp_region(&region, 0.1), 0.1);
    assert_eq!(clamp_region(&region, 99.0), 0.2);
    assert_eq!(clamp_region(&region, -99.0), -0.15);
}
