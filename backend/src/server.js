require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/api/boston-meters', async (req, res) => {
  // Updated URL with your specific fields
    const arcgisUrl = "https://gisportal.boston.gov/arcgis/rest/services/Infrastructure/OpenData/MapServer/9/query?where=1%3D1&outFields=VENDOR,PAY_POLICY,PARK_NO_PAY,BLK_NO,STREET,LOCK_,LONGITUDE,LATITUDE,TRAVEL_DIRECTION,SPACE_NUMBER,NUMBEROFSPACES,SPACE_STATE,METER_ID,DIR,BASE_RATE&outSR=4326&f=json";

    try {
        const response = await fetch(arcgisUrl);
        
        if (!response.ok) {
            throw new Error(`ArcGIS Error: ${response.status}`);
        }

        const json = await response.json();

        if (!json.features) {
            return res.status(404).json({ message: "No features found in the ArcGIS response." });
        }

        // Map through the features to extract all requested attributes
        const formattedData = json.features.map(feature => {
            const attr = feature.attributes;
            return {
                meter_id: attr.METER_ID,
                vendor: attr.VENDOR,
                street: attr.STREET,
                block_number: attr.BLK_NO,
                space_number: attr.SPACE_NUMBER,
                num_spaces: attr.NUMBEROFSPACES,
                base_rate: attr.BASE_RATE,
                pay_policy: attr.PAY_POLICY,
                no_pay_info: attr.PARK_NO_PAY,
                space_state: attr.SPACE_STATE,
                travel_dir: attr.TRAVEL_DIRECTION,
                direction: attr.DIR,
                is_locked: attr.LOCK_,
                // Use the explicit Longitude/Latitude fields or the geometry object
                location: {
                longitude: attr.LONGITUDE || feature.geometry?.x,
                latitude: attr.LATITUDE || feature.geometry?.y
                }
            };
        });

        res.json({
            success: true,
            count: formattedData.length,
            data: formattedData
        });
        console.log(`Successfully retrieved ${formattedData.length} parking meter records.`);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});