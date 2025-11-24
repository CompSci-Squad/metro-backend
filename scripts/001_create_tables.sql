-- Criação do banco de dados para Sistema de Monitoramento de Obras
-- Versão consolidada com todas as configurações

-- Função para gerar IDs aleatórios únicos
CREATE OR REPLACE FUNCTION generate_random_id()
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
    done BOOLEAN;
BEGIN
    done := FALSE;
    WHILE NOT done LOOP
        new_id := floor(random() * 900000 + 100000)::INTEGER;
        done := NOT EXISTS(SELECT 1 FROM obras WHERE id = new_id);
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Tabela de Obras
CREATE TABLE IF NOT EXISTS obras (
    id INTEGER PRIMARY KEY DEFAULT generate_random_id(),
    nome_obra VARCHAR(255) NOT NULL,
    responsavel_obra VARCHAR(255) NOT NULL,
    localizacao TEXT NOT NULL,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    previsao_termino DATE NOT NULL,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'planejamento',
    progresso DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fotos
CREATE TABLE IF NOT EXISTS fotos (
    id SERIAL PRIMARY KEY,
    obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    nome_foto VARCHAR(255) NOT NULL,
    descricao_foto TEXT,
    data_foto DATE NOT NULL,
    url_s3 TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relatórios
-- Adicionadas colunas para integração com IA VIRAG-BIM e geração de PDFs
CREATE TABLE IF NOT EXISTS relatorios (
    id SERIAL PRIMARY KEY,
    obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    nome_relatorio VARCHAR(255) NOT NULL,
    conteudo_json JSONB NOT NULL,
    analysis_id VARCHAR(255) UNIQUE,
    pdf_s3_key TEXT,
    analyzed_at TIMESTAMP,
    overall_progress DECIMAL(5,4),
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Arquivos BIM
CREATE TABLE IF NOT EXISTS arquivos_bim (
    id SERIAL PRIMARY KEY,
    obra_id INTEGER NOT NULL UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(100) NOT NULL,
    tamanho_arquivo BIGINT NOT NULL,
    url_s3 TEXT NOT NULL,
    s3_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_obras_status ON obras(status);
CREATE INDEX IF NOT EXISTS idx_fotos_obra_id ON fotos(obra_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_obra_id ON relatorios(obra_id);
-- Adicionado índice para analysis_id da IA
CREATE INDEX IF NOT EXISTS idx_relatorios_analysis_id ON relatorios(analysis_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_bim_s3_key ON arquivos_bim(s3_key);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obras_updated_at
    BEFORE UPDATE ON obras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arquivos_bim_updated_at
    BEFORE UPDATE ON arquivos_bim
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE obras IS 'Tabela principal de projetos de construção';
COMMENT ON TABLE fotos IS 'Fotos das obras armazenadas no S3';
COMMENT ON TABLE relatorios IS 'Relatórios em formato JSON com suporte a análises da IA';
COMMENT ON TABLE arquivos_bim IS 'Arquivo BIM único por projeto armazenado no S3';

-- Comentários nas colunas de relatórios
COMMENT ON COLUMN relatorios.analysis_id IS 'ID único da análise da IA VIRAG-BIM (relação 1:1)';
COMMENT ON COLUMN relatorios.pdf_s3_key IS 'Chave S3 do PDF gerado';
COMMENT ON COLUMN relatorios.analyzed_at IS 'Data/hora da análise da IA';
COMMENT ON COLUMN relatorios.overall_progress IS 'Progresso geral da obra no momento da análise';
COMMENT ON COLUMN relatorios.sequence_number IS 'Número sequencial da foto/análise';
