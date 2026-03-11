use polybash_contracts::{RegionDescriptor, StylePack};

pub fn clamp_region(region: &RegionDescriptor, value: f32) -> f32 {
    value.clamp(region.min, region.max)
}

pub fn connector_is_compatible(style_pack: &StylePack, left_kind: &str, right_kind: &str) -> bool {
    style_pack
        .connector_taxonomy
        .get(left_kind)
        .map(|allowed| allowed.iter().any(|kind| kind == right_kind))
        .unwrap_or(false)
        || style_pack
            .connector_taxonomy
            .get(right_kind)
            .map(|allowed| allowed.iter().any(|kind| kind == left_kind))
            .unwrap_or(false)
}
