export interface IBuses {
    id?: number;
    licensePlate: string;
    chassisBrand: string;
    bodyworkBrand: string;
    photo?: string | null;
    busTypeId: number;
    seats: IBusSeat[];
    // Campos locales para UI (no se envían al backend)
    capacity?: number;
    floorCount?: number;
    photos?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    numberOfFloors?: number; // 1 or 2 - Solo para UI (ahora opcional)
}

export interface IBusSeat {
    id?: number;
    busId?: number;
    number: string | number;
    type: 'NORMAL' | 'VIP';
    location: 'WINDOW_LEFT' | 'WINDOW_RIGHT' | 'AISLE_LEFT' | 'AISLE_RIGHT' | 'MIDDLE';
    floor?: number; // 1 or 2 - Solo para UI (ahora opcional)
    status?: 'ACTIVE' | 'INACTIVE';
    isDeleted?: boolean;
}

export interface IBusType {
    id: number;
    name: string;
    description: string;
    floorCount: number;
    seatsFloor1: number;
    seatsFloor2: number;
    aditionalPrice: string;
    isDeleted: boolean;
}