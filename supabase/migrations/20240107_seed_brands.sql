-- Seed common brands
INSERT INTO brands (name) VALUES
('Nike'), ('Adidas'), ('Uniqlo'), ('Zara'), ('H&M'),
('Gucci'), ('Louis Vuitton'), ('Chanel'), ('Hermès'), ('Prada'),
('Dior'), ('Burberry'), ('Versace'), ('Fendi'), ('Balenciaga'),
('Saint Laurent'), ('Givenchy'), ('Valentino'), ('Armani'), ('Ralph Lauren'),
('Levi''s'), ('Gap'), ('Calvin Klein'), ('Tommy Hilfiger'), ('Under Armour'),
('Puma'), ('New Balance'), ('Converse'), ('Vans'), ('Reebok'),
('The North Face'), ('Patagonia'), ('Columbia'), ('Lululemon'), ('Arc''teryx'),
('Supreme'), ('Off-White'), ('Stüssy'), ('Carhartt'), ('Dickies'),
('Massimo Dutti'), ('COS'), ('& Other Stories'), ('Mango'), ('Pull&Bear'),
('Bershka'), ('Forever 21'), ('Urban Outfitters'), ('ASOS'), ('Shein'),
('Celine'), ('Bottega Veneta'), ('Loewe'), ('Miu Miu'), ('Alexander McQueen')
ON CONFLICT (name) DO NOTHING;
