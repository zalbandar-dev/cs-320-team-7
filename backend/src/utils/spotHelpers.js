// Zacky — functions 12-14
// listAllAvailable, searchByZip, getSpotDetails

// Returns spot_ids that have active/pending_provider bookings overlapping [startTime, endTime].
// Used by listing routes to filter out unavailable spots for a given window.
async function getConflictingSpotIds(supabase, startTime, endTime) {
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('spot_id')
        .in('status', ['active', 'pending_provider'])
        .lt('start_time', endTime)
        .gt('end_time', startTime);

    if (!conflicts || conflicts.length === 0) return [];
    return [...new Set(conflicts.map(c => c.spot_id))];
}

// Toggles the available flag on a spot. Only the owning provider may call this.
async function updateAvailability(supabase, spotId, providerId, status) {
    const { data: spot, error: fetchError } = await supabase
        .from('parking_spots')
        .select('spot_id, provider_id')
        .eq('spot_id', spotId)
        .single();

    if (fetchError || !spot) return { success: false, error: 'Spot not found' };
    if (spot.provider_id !== providerId) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('parking_spots')
        .update({ available: status })
        .eq('spot_id', spotId)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

module.exports = { getConflictingSpotIds, updateAvailability };

